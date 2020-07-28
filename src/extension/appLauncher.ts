// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as vscode from "vscode";
import {Packager} from "../common/packager";
import {RNPackageVersions} from "../common/projectVersionHelper";
import {ExponentHelper} from "./exponent/exponentHelper";
import {ReactDirManager} from "./reactDirManager";
import {SettingsHelper} from "./settingsHelper";
import {PackagerStatusIndicator} from "./packagerStatusIndicator";
import {CommandExecutor} from "../common/commandExecutor";
import {isNullOrUndefined} from "../common/utils";
import {OutputChannelLogger} from "./log/OutputChannelLogger";
import {MobilePlatformDeps} from "./generalMobilePlatform";
import {PlatformResolver} from "./platformResolver";
import {ProjectVersionHelper} from "../common/projectVersionHelper";
import {TelemetryHelper} from "../common/telemetryHelper";
import {ErrorHelper} from "../common/error/errorHelper";
import {InternalErrorCode} from "../common/error/internalErrorCode";
import {TargetPlatformHelper} from "../common/targetPlatformHelper";
import {LogCatMonitor} from "./android/logCatMonitor";
import {ProjectsStorage} from "./projectsStorage";
import {ReactNativeCDPProxy} from "../cdp-proxy/reactNativeCDPProxy";
import {generateRandomPortNumber} from "../common/extensionHelper";
import {DEBUG_TYPES} from "./debugConfigurationProvider";
import {AndroidPlatform} from "./android/androidPlatform";
import * as nls from "vscode-nls";
import { MultipleLifetimesAppWorker } from "../debugger/appWorker";
import { LaunchScenariosManager } from "./launchScenariosManager";
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize = nls.loadMessageBundle();

export class AppLauncher {
    private readonly cdpProxyPort: number;
    private readonly cdpProxyHostAddress: string;

    private appWorker: MultipleLifetimesAppWorker | null;
    private packager: Packager;
    private exponentHelper: ExponentHelper;
    private reactDirManager: ReactDirManager;
    private workspaceFolder: vscode.WorkspaceFolder;
    private reactNativeVersions?: RNPackageVersions;
    private rnCdpProxy: ReactNativeCDPProxy;
    private logger: OutputChannelLogger = OutputChannelLogger.getMainChannel();
    private logCatMonitor: LogCatMonitor | null = null;
    private launchScenarosManager: LaunchScenariosManager;

    public static getAppLauncherByProjectRootPath(projectRootPath: string): AppLauncher {
        const appLauncher = ProjectsStorage.projectsCache[projectRootPath.toLowerCase()];
        if (!appLauncher) {
            throw new Error(`Could not find AppLauncher by the project root path ${projectRootPath}`);
        }

        return appLauncher;
    }

    constructor(reactDirManager: ReactDirManager, workspaceFolder: vscode.WorkspaceFolder) {
        // constants definition
        this.cdpProxyPort = generateRandomPortNumber();
        this.cdpProxyHostAddress = "127.0.0.1"; // localhost

        const rootPath = workspaceFolder.uri.fsPath;
        const projectRootPath = SettingsHelper.getReactNativeProjectRoot(rootPath);
        this.exponentHelper = new ExponentHelper(rootPath, projectRootPath);
        const packagerStatusIndicator: PackagerStatusIndicator = new PackagerStatusIndicator(rootPath);
        this.packager = new Packager(rootPath, projectRootPath, SettingsHelper.getPackagerPort(workspaceFolder.uri.fsPath), packagerStatusIndicator);
        this.packager.setExponentHelper(this.exponentHelper);
        this.launchScenarosManager = new LaunchScenariosManager(rootPath);
        this.reactDirManager = reactDirManager;
        this.workspaceFolder = workspaceFolder;
        this.rnCdpProxy = new ReactNativeCDPProxy(
            this.cdpProxyHostAddress,
            this.cdpProxyPort
        );
    }

    public getCdpProxyPort(): number {
        return this.cdpProxyPort;
    }

    public getRnCdpProxy(): ReactNativeCDPProxy {
        return this.rnCdpProxy;
    }

    public getPackager(): Packager {
        return this.packager;
    }

    public getWorkspaceFolderUri(): vscode.Uri {
        return this.workspaceFolder.uri;
    }

    public getWorkspaceFolder(): vscode.WorkspaceFolder {
        return this.workspaceFolder;
    }

    public getReactNativeVersions(): RNPackageVersions | undefined {
        return this.reactNativeVersions;
    }

    public getExponentHelper(): ExponentHelper {
        return this.exponentHelper;
    }

    public getReactDirManager(): ReactDirManager {
        return this.reactDirManager;
    }

    public setReactNativeVersions(reactNativeVersions: RNPackageVersions): void {
        this.reactNativeVersions = reactNativeVersions;
    }

    public setAppWorker(appWorker: MultipleLifetimesAppWorker): void {
        this.appWorker = appWorker;
    }

    public getAppWorker(): MultipleLifetimesAppWorker | null {
        return this.appWorker;
    }

    public dispose(): void {
        this.packager.getStatusIndicator().dispose();
        this.packager.stop(true);
        this.stopMonitoringLogCat();
    }

    public stopMonitoringLogCat(): void {
        if (this.logCatMonitor) {
            this.logCatMonitor.dispose();
            this.logCatMonitor = null;
        }
    }

    public openFileAtLocation(filename: string, lineNumber: number): Promise<void> {
        return new Promise((resolve) => {
            vscode.workspace.openTextDocument(vscode.Uri.file(filename))
                .then((document: vscode.TextDocument) => {
                    vscode.window.showTextDocument(document)
                        .then((editor: vscode.TextEditor) => {
                            let range = editor.document.lineAt(lineNumber - 1).range;
                            editor.selection = new vscode.Selection(range.start, range.end);
                            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                            resolve();
                        });
                });
        });
    }

    public getPackagerPort(projectFolder: string): number {
        return SettingsHelper.getPackagerPort(projectFolder);
    }

    public launch(launchArgs: any): Promise<any> {
        let mobilePlatformOptions = this.requestSetup(launchArgs);

        // We add the parameter if it's defined (adapter crashes otherwise)
        if (!isNullOrUndefined(launchArgs.logCatArguments)) {
            mobilePlatformOptions.logCatArguments = [this.parseLogCatArguments(launchArgs.logCatArguments)];
        }

        if (!isNullOrUndefined(launchArgs.variant)) {
            mobilePlatformOptions.variant = launchArgs.variant;
        }

        if (!isNullOrUndefined(launchArgs.scheme)) {
            mobilePlatformOptions.scheme = launchArgs.scheme;
        }

        if (!isNullOrUndefined(launchArgs.productName)) {
            mobilePlatformOptions.productName = launchArgs.productName;
        }

        if (!isNullOrUndefined(launchArgs.launchActivity)) {
            mobilePlatformOptions.debugLaunchActivity = launchArgs.launchActivity;
        }

        if (launchArgs.type === DEBUG_TYPES.REACT_NATIVE_DIRECT) {
            mobilePlatformOptions.isDirect = true;
        }

        mobilePlatformOptions.packagerPort = SettingsHelper.getPackagerPort(launchArgs.cwd || launchArgs.program);
        const platformDeps: MobilePlatformDeps = {
            packager: this.packager,
        };
        const mobilePlatform = new PlatformResolver()
            .resolveMobilePlatform(launchArgs.platform, mobilePlatformOptions, platformDeps);
        return new Promise((resolve, reject) => {
            let extProps: any = {
                platform: {
                    value: launchArgs.platform,
                    isPii: false,
                },
            };

            if (mobilePlatformOptions.isDirect) {
                extProps.isDirect = {
                    value: true,
                    isPii: false,
                };
            }

            return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(mobilePlatformOptions.projectRoot, true)
                .then(versions => {
                    mobilePlatformOptions.reactNativeVersions = versions;
                    extProps = TelemetryHelper.addPropertyToTelemetryProperties(versions.reactNativeVersion, "reactNativeVersion", extProps);
                    if (launchArgs.platform === "windows") {
                        if (ProjectVersionHelper.isVersionError(versions.reactNativeWindowsVersion)) {
                            throw ErrorHelper.getInternalError(InternalErrorCode.ReactNativeWindowsIsNotInstalled);
                        }
                        extProps = TelemetryHelper.addPropertyToTelemetryProperties(versions.reactNativeWindowsVersion, "reactNativeWindowsVersion", extProps);
                    }
                    TelemetryHelper.generate("launch", extProps, (generator) => {
                        generator.step("checkPlatformCompatibility");
                        TargetPlatformHelper.checkTargetPlatformSupport(mobilePlatformOptions.platform);
                        return mobilePlatform.beforeStartPackager()
                            .then(() => {
                                generator.step("startPackager");
                                return mobilePlatform.startPackager();
                            })
                            .then(() => {
                                // We've seen that if we don't prewarm the bundle cache, the app fails on the first attempt to connect to the debugger logic
                                // and the user needs to Reload JS manually. We prewarm it to prevent that issue
                                generator.step("prewarmBundleCache");
                                this.logger.info(localize("PrewarmingBundleCache", "Prewarming bundle cache. This may take a while ..."));
                                return mobilePlatform.prewarmBundleCache();
                            })
                            .then(() => {
                                if (launchArgs.platform === "android" && mobilePlatform instanceof AndroidPlatform) {
                                    return mobilePlatform.startEmulatorIfNotRun(launchArgs.target);
                                }
                                else return undefined;
                            })
                            .then((emulator: any) => {
                                if (emulator) {
                                    if (emulator.emulatorName) {
                                        let launchConfigIndex = this.launchScenarosManager.getFirstScenarioIndexByParams(launchArgs);
                                        const launchScenarios = this.launchScenarosManager.getLaunchScenarios();
                                        if (launchConfigIndex !== null && launchConfigIndex !== undefined && launchScenarios.configurations) {
                                            launchScenarios.configurations[launchConfigIndex].target = emulator.emulatorName;
                                            this.launchScenarosManager.writeLaunchScenarios(launchScenarios);
                                        }
                                    }
                                    if (emulator.emulatorId) {
                                        if (launchArgs.platform === "android") {
                                            launchArgs.target = emulator.emulatorId;
                                            mobilePlatformOptions.target = emulator.emulatorId;
                                        }
                                        if (launchArgs.platform === "ios") {
                                            launchArgs.target = emulator.emulatorName;
                                            mobilePlatformOptions.target = emulator.emulatorName;
                                        }
                                        mobilePlatform.runArguments = mobilePlatform.getRunArguments();
                                    }
                                }
                                else {
                                    mobilePlatformOptions.target = undefined;
                                    mobilePlatform.runArguments = mobilePlatform.getRunArguments();
                                }
                            })
                            .then(() => {
                                generator.step("mobilePlatform.runApp").add("target", mobilePlatformOptions.target, false);
                                this.logger.info(localize("BuildingAndRunningApplication", "Building and running application."));
                                return mobilePlatform.runApp();
                            })
                            .then(() => {
                                if (mobilePlatformOptions.isDirect || !mobilePlatformOptions.enableDebug) {
                                    if (mobilePlatformOptions.isDirect && launchArgs.platform === "android") {
                                        generator.step("mobilePlatform.enableDirectDebuggingMode");
                                        if (mobilePlatformOptions.enableDebug) {
                                            this.logger.info(localize("PrepareHermesDebugging", "Prepare Hermes debugging (experimental)"));
                                        } else {
                                            this.logger.info(localize("PrepareHermesLaunch", "Prepare Hermes launch (experimental)"));
                                        }
                                    } else {
                                        generator.step("mobilePlatform.disableJSDebuggingMode");
                                        this.logger.info(localize("DisableJSDebugging", "Disable JS Debugging"));
                                    }
                                    return mobilePlatform.disableJSDebuggingMode();
                                }
                                generator.step("mobilePlatform.enableJSDebuggingMode");
                                this.logger.info(localize("EnableJSDebugging", "Enable JS Debugging"));
                                return mobilePlatform.enableJSDebuggingMode();
                            })
                            .then(() => {
                                resolve();
                            })
                            .catch(error => {
                                if (!mobilePlatformOptions.enableDebug && launchArgs.platform === "ios") {
                                    // If we disable debugging mode for iOS scenarios, we'll we ignore the error and run the 'run-ios' command anyway,
                                    // since the error doesn't affects an application launch process
                                    return resolve();
                                }
                                generator.addError(error);
                                this.logger.error(error);
                                reject(error);
                            });
                    });
                })
                .catch(error => {
                    if (error && error.errorCode) {
                        if (error.errorCode === InternalErrorCode.ReactNativePackageIsNotInstalled) {
                            TelemetryHelper.sendErrorEvent(
                                "ReactNativePackageIsNotInstalled",
                                ErrorHelper.getInternalError(InternalErrorCode.ReactNativePackageIsNotInstalled)
                                );
                        } else if (error.errorCode === InternalErrorCode.ReactNativeWindowsIsNotInstalled) {
                            TelemetryHelper.sendErrorEvent(
                                "ReactNativeWindowsPackageIsNotInstalled",
                                ErrorHelper.getInternalError(InternalErrorCode.ReactNativeWindowsIsNotInstalled)
                                );
                        }
                    }
                    this.logger.error(error);
                    reject(error);
                });
        });
    }

    private requestSetup(args: any): any {
        const workspaceFolder: vscode.WorkspaceFolder = <vscode.WorkspaceFolder>vscode.workspace.getWorkspaceFolder(vscode.Uri.file(args.cwd || args.program));
        const projectRootPath = this.getProjectRoot(args);
        let mobilePlatformOptions: any = {
            workspaceRoot: workspaceFolder.uri.fsPath,
            projectRoot: projectRootPath,
            platform: args.platform,
            env: args.env,
            envFile: args.envFile,
            target: args.target || "simulator",
            enableDebug: args.enableDebug,
        };

        if (args.platform === "exponent") {
            mobilePlatformOptions.expoHostType = args.expoHostType || "tunnel";
        }

        CommandExecutor.ReactNativeCommand = SettingsHelper.getReactNativeGlobalCommandName(workspaceFolder.uri);

        if (!args.runArguments) {
            let runArgs = SettingsHelper.getRunArgs(args.platform, args.target || "simulator", workspaceFolder.uri);
            mobilePlatformOptions.runArguments = runArgs;
        } else {
            mobilePlatformOptions.runArguments = args.runArguments;
        }

        return mobilePlatformOptions;
    }

    private getProjectRoot(args: any): string {
        return SettingsHelper.getReactNativeProjectRoot(args.cwd || args.program);
    }

    /**
     * Parses log cat arguments to a string
     */
    private parseLogCatArguments(userProvidedLogCatArguments: any): string {
        return Array.isArray(userProvidedLogCatArguments)
            ? userProvidedLogCatArguments.join(" ") // If it's an array, we join the arguments
            : userProvidedLogCatArguments; // If not, we leave it as-is
    }
}
