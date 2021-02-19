// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import { RSocketServer } from "rsocket-core";
import RSocketTCPServer from "rsocket-tcp-server";
import { AdbHelper } from "../android/adb";
import { Single } from "rsocket-flowable";
import { appNameWithUpdateHint, buildClientId } from "./clientUtils";
import { SecureClientQuery, ClientCsrQuery, ClientDevice, ClientQuery } from "./clientDevice";
import { OutputChannelLogger } from "../log/OutputChannelLogger";
import { Responder, Payload, ReactiveSocket } from "rsocket-types";
import {
    CertificateProvider,
    SecureServerConfig,
    CertificateExchangeMedium,
} from "./certificateProvider";
import * as net from "net";
import * as tls from "tls";

function transformCertificateExchangeMediumToType(
    medium: number | undefined,
): CertificateExchangeMedium {
    if (medium == 1) {
        return "FS_ACCESS";
    } else if (medium == 2) {
        return "WWW";
    } else {
        return "FS_ACCESS";
    }
}

export class NetworkInspectorServer {
    private readonly secureServerPort = 8088;
    private readonly insecureServerPort = 8089;

    private connections: Map<string, ClientDevice>;
    private secureServer: RSocketServer<any, any> | null;
    private insecureServer: RSocketServer<any, any> | null;
    private certificateProvider: CertificateProvider;
    private initialisePromise: Promise<void> | null;
    private logger: OutputChannelLogger;

    constructor() {
        this.connections = new Map<string, ClientDevice>();
        this.logger = OutputChannelLogger.getMainChannel();
    }

    public async start(adbHelper: AdbHelper): Promise<void> {
        this.logger.info("Starting Network inspector");
        this.initialisePromise = new Promise(async (resolve, reject) => {
            this.certificateProvider = new CertificateProvider(adbHelper);

            try {
                let options = await this.certificateProvider.loadSecureServerConfig();
                this.secureServer = await this.startServer(this.secureServerPort, options);
                this.insecureServer = await this.startServer(this.insecureServerPort);
            } catch (err) {
                reject(err);
            }

            this.logger.info("Network inspector is working");
            resolve();
        });
        return await this.initialisePromise;
    }

    public async stop(): Promise<void> {
        if (this.initialisePromise) {
            try {
                await this.initialisePromise;
            } catch (err) {
                this.logger.debug(err.toString());
            }
            if (this.secureServer) {
                this.secureServer.stop();
            }
            if (this.insecureServer) {
                this.insecureServer.stop();
            }
        }
        this.logger.info("Network inspector has been stopped");
    }

    private async startServer(
        port: number,
        sslConfig?: SecureServerConfig,
    ): Promise<RSocketServer<any, any>> {
        return new Promise((resolve, reject) => {
            let rsServer: RSocketServer<any, any> | undefined; // eslint-disable-line prefer-const
            const serverFactory = (onConnect: (socket: net.Socket) => void) => {
                const transportServer = sslConfig
                    ? tls.createServer(sslConfig, socket => {
                          onConnect(socket);
                      })
                    : net.createServer(onConnect);
                transportServer
                    .on("error", err => {
                        this.logger.error(
                            `Error while opening Network inspector server on port ${port}`,
                        );
                        reject(err);
                    })
                    .on("listening", () => {
                        this.logger.debug(
                            `${
                                sslConfig ? "Secure" : "Certificate"
                            } server started on port ${port}`,
                        );
                        resolve(rsServer!);
                    });
                return transportServer;
            };
            rsServer = new RSocketServer({
                getRequestHandler: sslConfig
                    ? this.trustedRequestHandler
                    : this.untrustedRequestHandler,
                transport: new RSocketTCPServer({
                    port: port,
                    serverFactory: serverFactory,
                }),
            });
            rsServer && rsServer.start();
        });
    }

    private trustedRequestHandler = (
        socket: ReactiveSocket<string, any>,
        payload: Payload<string, any>,
    ): Partial<Responder<string, any>> => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const server = this;
        if (!payload.data) {
            return {};
        }

        const clientData: SecureClientQuery = JSON.parse(payload.data);

        const { app, os, device, device_id, sdk_version, csr, csr_path, medium } = clientData;
        const transformedMedium = transformCertificateExchangeMediumToType(medium);

        const client: Promise<ClientDevice> = this.addConnection(
            socket,
            {
                app,
                os,
                device,
                device_id,
                sdk_version,
                medium: transformedMedium,
            },
            { csr, csr_path },
        ).then(client => {
            return (resolvedClient = client);
        });
        let resolvedClient: ClientDevice | undefined;

        socket.connectionStatus().subscribe({
            onNext(payload) {
                if (payload.kind == "ERROR" || payload.kind == "CLOSED") {
                    client.then(client => {
                        server.logger.info(
                            `Device disconnected ${client.id} from the Network inspector`,
                        );
                        server.removeConnection(client.id);
                    });
                }
            },
            onSubscribe(subscription) {
                subscription.request(Number.MAX_SAFE_INTEGER);
            },
            onError(error) {
                server.logger.error("[server] connection status error ", error);
            },
        });

        return {
            fireAndForget: (payload: { data: string }) => {
                if (resolvedClient) {
                    resolvedClient.onMessage(payload.data);
                } else {
                    client.then(client => {
                        client.onMessage(payload.data);
                    });
                }
            },
        };
    };

    private untrustedRequestHandler = (
        _socket: ReactiveSocket<string, any>,
        payload: Payload<string, any>,
    ): Partial<Responder<string, any>> => {
        if (!payload.data) {
            return {};
        }
        const clientData: ClientQuery = JSON.parse(payload.data);

        return {
            requestResponse: (payload: Payload<string, any>): Single<Payload<string, any>> => {
                if (typeof payload.data !== "string") {
                    return new Single(() => {});
                }

                let rawData;
                try {
                    rawData = JSON.parse(payload.data);
                } catch (err) {
                    this.logger.error(`Network inspector: invalid JSON: ${payload.data}`);
                    return new Single(() => {});
                }

                const json: {
                    method: "signCertificate";
                    csr: string;
                    destination: string;
                    medium: number | undefined; // OSS's older Client SDK might not send medium information. This is not an issue for internal FB users, as Flipper release is insync with client SDK through launcher.
                } = rawData;

                if (json.method === "signCertificate") {
                    this.logger.debug("CSR received from device");

                    const { csr, destination, medium } = json;
                    return new Single(subscriber => {
                        subscriber.onSubscribe(undefined);
                        this.certificateProvider
                            .processCertificateSigningRequest(
                                csr,
                                clientData.os,
                                destination,
                                transformCertificateExchangeMediumToType(medium),
                            )
                            .then(result => {
                                subscriber.onComplete({
                                    data: JSON.stringify({
                                        deviceId: result.deviceId,
                                    }),
                                    metadata: "",
                                });
                            })
                            .catch(e => {
                                subscriber.onError(e);
                            });
                    });
                }
                return new Single(() => {});
            },

            // Leaving this here for a while for backwards compatibility,
            // but for up to date SDKs it will no longer used.
            // We can delete it after the SDK change has been using requestResponse for a few weeks.
            fireAndForget: (payload: Payload<string, any>) => {
                if (typeof payload.data !== "string") {
                    return;
                }

                let json:
                    | {
                          method: "signCertificate";
                          csr: string;
                          destination: string;
                          medium: number | undefined;
                      }
                    | undefined;
                try {
                    json = JSON.parse(payload.data);
                } catch (err) {
                    this.logger.error(`Network inspector: invalid JSON: ${payload.data}`);
                    return;
                }

                if (json && json.method === "signCertificate") {
                    this.logger.debug("CSR received from device");
                    const { csr, destination, medium } = json;
                    this.certificateProvider
                        .processCertificateSigningRequest(
                            csr,
                            clientData.os,
                            destination,
                            transformCertificateExchangeMediumToType(medium),
                        )
                        .catch(e => {
                            console.error(e);
                        });
                }
            },
        };
    };

    private async addConnection(
        conn: ReactiveSocket<any, any>,
        query: ClientQuery & { medium: CertificateExchangeMedium },
        csrQuery: ClientCsrQuery,
    ): Promise<ClientDevice> {
        // try to get id by comparing giving `csr` to file from `csr_path`
        // otherwise, use given device_id
        const { csr_path, csr } = csrQuery;
        // For iOS we do not need to confirm the device id, as it never changes unlike android.
        return (csr_path && csr && query.os != "iOS"
            ? this.certificateProvider.extractAppNameFromCSR(csr).then(appName => {
                  return this.certificateProvider.getTargetDeviceId(
                      query.os,
                      appName,
                      csr_path,
                      csr,
                  );
              })
            : Promise.resolve(query.device_id)
        ).then(async csrId => {
            query.device_id = csrId;
            query.app = appNameWithUpdateHint(query);

            const id = buildClientId({
                app: query.app,
                os: query.os,
                device: query.device,
                device_id: csrId,
            });
            this.logger.debug(`Device connected: ${id}`);

            const client = new ClientDevice(id, query, conn);

            client.init().then(() => {
                /* If a device gets disconnected without being cleaned up properly,
                 * Flipper won't be aware until it attempts to reconnect.
                 * When it does we need to terminate the zombie connection.
                 */
                this.removeConnection(id);

                this.connections.set(id, client);
            });

            return client;
        });
    }

    private removeConnection(id: string) {
        const clientDevice = this.connections.get(id);
        if (clientDevice) {
            clientDevice.connection && clientDevice.connection.close();
            this.connections.delete(id);
        }
    }
}
