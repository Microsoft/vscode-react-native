// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as https from "https";
import { CancellationTokenSource } from "vscode";
import { PromiseUtil } from "../common/node/promise";

export interface IConfig {}

export function downloadConfig<T extends IConfig | IConfig[]>(endpointURL: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        https
            .get(endpointURL, response => {
                let data = "";
                response.setEncoding("utf8");
                response.on("data", (chunk: string) => (data += chunk));
                response.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                });
                response.on("error", reject);
            })
            .on("error", reject);
    });
}

export async function retryDownloadConfig<T extends IConfig | IConfig[]>(
    endpointURL: string,
    cancellationTokenSource: CancellationTokenSource,
    retryCount = 60,
): Promise<T> {
    try {
        return await downloadConfig<T>(endpointURL);
    } catch (err) {
        if (retryCount < 1 || cancellationTokenSource.token.isCancellationRequested) {
            throw err;
        }

        await PromiseUtil.delay(2000);
        return await retryDownloadConfig(endpointURL, cancellationTokenSource, --retryCount);
    }
}
