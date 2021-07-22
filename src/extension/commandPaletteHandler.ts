// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as vscode from "vscode";
import * as XDL from "./exponent/xdlInterface";
import { SettingsHelper } from "./settingsHelper";
import { OutputChannelLogger } from "./log/OutputChannelLogger";
import { TargetType, GeneralMobilePlatform } from "./generalMobilePlatform";
import { AndroidPlatform } from "./android/androidPlatform";
import { IOSPlatform } from "./ios/iOSPlatform";
import { ProjectVersionHelper, REACT_NATIVE_PACKAGES } from "../common/projectVersionHelper";
import { ParsedPackage, ReactNativeProjectHelper } from "../common/reactNativeProjectHelper";
import { TargetPlatformHelper } from "../common/targetPlatformHelper";
import { TelemetryHelper } from "../common/telemetryHelper";
import { ProjectsStorage } from "./projectsStorage";
import {
    IAndroidRunOptions,
    IIOSRunOptions,
    ImacOSRunOptions,
    IWindowsRunOptions,
    PlatformType,
} from "./launchArgs";
import { ExponentPlatform } from "./exponent/exponentPlatform";
import { spawn, ChildProcess } from "child_process";
import { HostPlatform } from "../common/hostPlatform";
import { LaunchJsonCompletionHelper } from "../common/launchJsonCompletionHelper";
import { ReactNativeDebugConfigProvider } from "./debuggingConfiguration/reactNativeDebugConfigProvider";
import { CommandExecutor } from "../common/commandExecutor";
import { isWorkspaceTrusted } from "../common/extensionHelper";
import * as nls from "vscode-nls";
import { ErrorHelper } from "../common/error/errorHelper";
import { InternalErrorCode } from "../common/error/internalErrorCode";
import { AppLauncher } from "./appLauncher";
import { AndroidEmulatorManager } from "./android/androidEmulatorManager";
import { AndroidDeviceTracker } from "./android/androidDeviceTracker";
import { IOSDeviceTracker } from "./ios/iOSDeviceTracker";
import { AdbHelper } from "./android/adb";
import { LogCatMonitor } from "./android/logCatMonitor";
import { LogCatMonitorManager } from "./android/logCatMonitorManager";
import { NetworkInspectorServer } from "./networkInspector/networkInspectorServer";
import { InspectorViewFactory } from "./networkInspector/views/inspectorViewFactory";
import { WindowsPlatform } from "./windows/windowsPlatform";
import { CONTEXT_VARIABLES_NAMES } from "../common/contextVariablesNames";
import { MacOSPlatform } from "./macos/macOSPlatform";
import { TipNotificationService } from "../extension/tipsNotificationsService/tipsNotificationService";
nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize = nls.loadMessageBundle();

interface NetworkInspectorModule {
    networkInspector: NetworkInspectorServer;
    androidDeviceTracker: AndroidDeviceTracker;
    iOSDeviceTracker: IOSDeviceTracker | null;
}

export class CommandPaletteHandler {
    public static elementInspector: ChildProcess | null;
    private static networkInspectorModule: NetworkInspectorModule | null;
    private static logger: OutputChannelLogger = OutputChannelLogger.getMainChannel();

    /**
     * Starts the React Native packager
     */
    public static startPackager(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            return (
                this.trustedWorkspaceRequired(
                    appLauncher.getPackager().getProjectPath(),
                    "Start Packager",
                )
                    .then(() => {
                        const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
                        return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                            nodeModulesRoot,
                        );
                    })
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .then(versions => {
                        return this.executeCommandInContext(
                            "startPackager",
                            appLauncher.getWorkspaceFolder(),
                            () => {
                                return appLauncher
                                    .getPackager()
                                    .isRunning()
                                    .then(running => {
                                        return running
                                            ? appLauncher.getPackager().stop()
                                            : Promise.resolve();
                                    });
                            },
                        ).then(() => appLauncher.getPackager().start());
                    })
            );
        });
    }

    /**
     * Kills the React Native packager invoked by the extension's packager
     */
    public static stopPackager(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            return this.trustedWorkspaceRequired(
                appLauncher.getPackager().getProjectPath(),
                "Stop Packager",
            ).then(() =>
                this.executeCommandInContext("stopPackager", appLauncher.getWorkspaceFolder(), () =>
                    appLauncher.getPackager().stop(),
                ),
            );
        });
    }

    public static stopAllPackagers(): Promise<void> {
        let keys = Object.keys(ProjectsStorage.projectsCache);
        let promises: Promise<void>[] = [];
        keys.forEach(key => {
            let appLauncher = ProjectsStorage.projectsCache[key];
            promises.push(
                this.executeCommandInContext("stopPackager", appLauncher.getWorkspaceFolder(), () =>
                    appLauncher.getPackager().stop(),
                ),
            );
        });

        return Promise.all(promises).then(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
    }

    /**
     * Restarts the React Native packager
     */
    public static restartPackager(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            return (
                this.trustedWorkspaceRequired(
                    appLauncher.getPackager().getProjectPath(),
                    "Restart Packager",
                )
                    .then(() => {
                        const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
                        return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                            nodeModulesRoot,
                        );
                    })
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .then(versions => {
                        return this.executeCommandInContext(
                            "restartPackager",
                            appLauncher.getWorkspaceFolder(),
                            () => this.runRestartPackagerCommandAndUpdateStatus(appLauncher),
                        );
                    })
            );
        });
    }

    /**
     * Execute command to publish to exponent host.
     */
    public static publishToExpHost(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            return this.executeCommandInContext(
                "publishToExpHost",
                appLauncher.getWorkspaceFolder(),
                () => {
                    return this.executePublishToExpHost(appLauncher).then(didPublish => {
                        if (!didPublish) {
                            CommandPaletteHandler.logger.warning(
                                localize(
                                    "ExponentPublishingWasUnsuccessfulMakeSureYoureLoggedInToExpo",
                                    "Publishing was unsuccessful. Please make sure you are logged in Expo and your project is a valid Expo project",
                                ),
                            );
                        }
                    });
                },
            );
        });
    }

    public static async launchAndroidEmulator(): Promise<void> {
        const appLauncher = await this.selectProject();
        const projectPath = appLauncher.getPackager().getProjectPath();
        const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
        const adbHelper = new AdbHelper(projectPath, nodeModulesRoot);
        const androidEmulatorManager = new AndroidEmulatorManager(adbHelper);
        const emulator = await androidEmulatorManager.startSelection();
        if (emulator) {
            androidEmulatorManager.tryLaunchEmulatorByName(emulator);
        }
    }

    /**
     * Executes the 'react-native run-android' command
     */
    public static runAndroid(target: TargetType = "simulator"): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            TargetPlatformHelper.checkTargetPlatformSupport(PlatformType.Android);
            const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
            return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                nodeModulesRoot,
            ).then(versions => {
                appLauncher.setReactNativeVersions(versions);
                return this.executeCommandInContext(
                    "runAndroid",
                    appLauncher.getWorkspaceFolder(),
                    () => {
                        const platform = <AndroidPlatform>(
                            this.createPlatform(
                                appLauncher,
                                PlatformType.Android,
                                AndroidPlatform,
                                target,
                            )
                        );
                        return platform
                            .resolveVirtualDevice(target)
                            .then(() => platform.beforeStartPackager())
                            .then(() => {
                                return platform.startPackager();
                            })
                            .then(() => {
                                return platform.runApp(/*shouldLaunchInAllDevices*/ true);
                            })
                            .then(() => {
                                return platform.disableJSDebuggingMode();
                            });
                    },
                );
            });
        });
    }

    /**
     * Executes the 'react-native run-ios' command
     */
    public static runIos(target: TargetType = "simulator"): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
            return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                nodeModulesRoot,
            ).then(versions => {
                appLauncher.setReactNativeVersions(versions);
                TargetPlatformHelper.checkTargetPlatformSupport(PlatformType.iOS);
                return this.executeCommandInContext(
                    "runIos",
                    appLauncher.getWorkspaceFolder(),
                    () => {
                        const platform = <IOSPlatform>(
                            this.createPlatform(appLauncher, PlatformType.iOS, IOSPlatform, target)
                        );
                        return (
                            platform
                                .resolveVirtualDevice(target)
                                .then(() => platform.beforeStartPackager())
                                .then(() => {
                                    return platform.startPackager();
                                })
                                .then(() => {
                                    // Set the Debugging setting to disabled, because in iOS it's persisted across runs of the app
                                    return platform.disableJSDebuggingMode();
                                })
                                // eslint-disable-next-line @typescript-eslint/no-empty-function
                                .catch(() => {}) // If setting the debugging mode fails, we ignore the error and we run the run ios command anyways
                                .then(() => {
                                    return platform.runApp();
                                })
                        );
                    },
                );
            });
        });
    }

    /**
     * Starts the Exponent packager
     */
    public static runExponent(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
            return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                nodeModulesRoot,
            ).then(versions => {
                return this.loginToExponent(appLauncher).then(() => {
                    return this.executeCommandInContext(
                        "runExponent",
                        appLauncher.getWorkspaceFolder(),
                        () => {
                            appLauncher.setReactNativeVersions(versions);
                            const platform = <ExponentPlatform>(
                                this.createPlatform(
                                    appLauncher,
                                    PlatformType.Exponent,
                                    ExponentPlatform,
                                )
                            );
                            return platform
                                .beforeStartPackager()
                                .then(() => {
                                    return platform.startPackager();
                                })
                                .then(() => {
                                    return platform.runApp();
                                });
                        },
                    );
                });
            });
        });
    }

    public static runWindows(): Promise<void> {
        TipNotificationService.getInstance().setKnownDateForFeatureById("debuggingRNWAndMacOSApps");
        const additionalPackagesToCheck: ParsedPackage[] = [
            REACT_NATIVE_PACKAGES.REACT_NATIVE_WINDOWS,
        ];
        return this.selectProject().then((appLauncher: AppLauncher) => {
            TargetPlatformHelper.checkTargetPlatformSupport(PlatformType.Windows);
            return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                appLauncher.getOrUpdateNodeModulesRoot(),
                additionalPackagesToCheck,
            ).then(versions => {
                appLauncher.setReactNativeVersions(versions);
                return this.executeCommandInContext(
                    "runWindows",
                    appLauncher.getWorkspaceFolder(),
                    () => {
                        const platform = <WindowsPlatform>(
                            this.createPlatform(appLauncher, PlatformType.Windows, WindowsPlatform)
                        );
                        return platform
                            .beforeStartPackager()
                            .then(() => {
                                return platform.startPackager();
                            })
                            .then(() => {
                                return platform.runApp(false);
                            });
                    },
                );
            });
        });
    }

    public static runMacOS(): Promise<void> {
        TipNotificationService.getInstance().setKnownDateForFeatureById("debuggingRNWAndMacOSApps");
        const additionalPackagesToCheck: ParsedPackage[] = [
            REACT_NATIVE_PACKAGES.REACT_NATIVE_MACOS,
        ];
        return this.selectProject().then((appLauncher: AppLauncher) => {
            TargetPlatformHelper.checkTargetPlatformSupport(PlatformType.macOS);
            return ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(
                appLauncher.getOrUpdateNodeModulesRoot(),
                additionalPackagesToCheck,
            ).then(versions => {
                appLauncher.setReactNativeVersions(versions);
                return this.executeCommandInContext(
                    "runMacOS",
                    appLauncher.getWorkspaceFolder(),
                    () => {
                        const platform = <MacOSPlatform>(
                            this.createPlatform(appLauncher, PlatformType.macOS, MacOSPlatform)
                        );
                        return (
                            platform
                                .beforeStartPackager()
                                .then(() => {
                                    return platform.startPackager();
                                })
                                .then(() => {
                                    // Set the Debugging setting to disabled, because in macOS it persists across runs of the app
                                    return platform.disableJSDebuggingMode();
                                })
                                // eslint-disable-next-line @typescript-eslint/no-empty-function
                                .catch(() => {}) // If setting the debugging mode fails, we ignore the error and we run the run ios command anyways
                                .then(() => {
                                    return platform.runApp();
                                })
                        );
                    },
                );
            });
        });
    }

    public static showDevMenu(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            const androidPlatform = <AndroidPlatform>(
                this.createPlatform(appLauncher, PlatformType.Android, AndroidPlatform)
            );
            androidPlatform
                .showDevMenu()
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                .catch(() => {}); // Ignore any errors

            if (process.platform === "darwin") {
                const iosPlatform = <IOSPlatform>(
                    this.createPlatform(appLauncher, PlatformType.iOS, IOSPlatform)
                );
                iosPlatform
                    .showDevMenu(appLauncher)
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    .catch(() => {}); // Ignore any errors
            }

            if (process.platform === "win32") {
                // TODO: implement Show DevMenu command for RNW
            }

            return Promise.resolve();
        });
    }

    public static reloadApp(): Promise<void> {
        return this.selectProject().then((appLauncher: AppLauncher) => {
            const androidPlatform = <AndroidPlatform>(
                this.createPlatform(appLauncher, PlatformType.Android, AndroidPlatform)
            );
            androidPlatform
                .reloadApp()
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                .catch(() => {}); // Ignore any errors

            if (process.platform === "win32") {
                const nodeModulesRoot = appLauncher.getOrUpdateNodeModulesRoot();
                ProjectVersionHelper.getReactNativePackageVersionsFromNodeModules(nodeModulesRoot, [
                    REACT_NATIVE_PACKAGES.REACT_NATIVE_WINDOWS,
                ]).then(RNPackageVersions => {
                    const isRNWProject = !ProjectVersionHelper.isVersionError(
                        RNPackageVersions.reactNativeWindowsVersion,
                    );

                    if (isRNWProject) {
                        const windowsPlatform = <WindowsPlatform>(
                            this.createPlatform(appLauncher, PlatformType.Windows, WindowsPlatform)
                        );
                        windowsPlatform
                            .reloadApp(appLauncher)
                            // eslint-disable-next-line @typescript-eslint/no-empty-function
                            .catch(() => {}); // Ignore any errors
                    }
                });
            }

            if (process.platform === "darwin") {
                const iosPlatform = <IOSPlatform>(
                    this.createPlatform(appLauncher, PlatformType.iOS, IOSPlatform)
                );
                iosPlatform
                    .reloadApp(appLauncher)
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    .catch(() => {}); // Ignore any errors
            }
            return Promise.resolve();
        });
    }

    public static runElementInspector(): Promise<void> {
        TipNotificationService.getInstance().setKnownDateForFeatureById("elementInspector");

        if (!CommandPaletteHandler.elementInspector) {
            // Remove the following env variables to prevent running electron app in node mode.
            // https://github.com/microsoft/vscode/issues/3011#issuecomment-184577502
            let env = Object.assign({}, process.env);
            delete env.ATOM_SHELL_INTERNAL_RUN_AS_NODE;
            delete env.ELECTRON_RUN_AS_NODE;
            let command = HostPlatform.getNpmCliCommand("react-devtools");
            CommandPaletteHandler.elementInspector = spawn(command, [], {
                env,
            });
            if (!CommandPaletteHandler.elementInspector.pid) {
                CommandPaletteHandler.elementInspector = null;
                return Promise.reject(
                    ErrorHelper.getInternalError(InternalErrorCode.ReactDevtoolsIsNotInstalled),
                );
            }
            CommandPaletteHandler.elementInspector.stdout.on("data", (data: string) => {
                this.logger.info(data);
            });
            CommandPaletteHandler.elementInspector.stderr.on("data", (data: string) => {
                this.logger.error(data);
            });
            CommandPaletteHandler.elementInspector.once("exit", () => {
                CommandPaletteHandler.elementInspector = null;
            });
        } else {
            this.logger.info(
                localize(
                    "AnotherElementInspectorAlreadyRun",
                    "Another element inspector already run",
                ),
            );
        }
        return Promise.resolve();
    }

    public static stopElementInspector(): void {
        return CommandPaletteHandler.elementInspector
            ? CommandPaletteHandler.elementInspector.kill()
            : void 0;
    }

    public static async startNetworkInspector(): Promise<void> {
        if (!CommandPaletteHandler.networkInspectorModule) {
            const appLauncher = await this.selectProject();
            const adbHelper = new AdbHelper(
                appLauncher.getPackager().getProjectPath(),
                appLauncher.getOrUpdateNodeModulesRoot(),
            );
            const networkInspector = new NetworkInspectorServer();
            const androidDeviceTracker = new AndroidDeviceTracker(adbHelper);
            let iOSDeviceTracker = null;
            if (process.platform === "darwin") {
                iOSDeviceTracker = new IOSDeviceTracker();
            }
            CommandPaletteHandler.networkInspectorModule = {
                networkInspector,
                androidDeviceTracker,
                iOSDeviceTracker,
            };
            try {
                if (iOSDeviceTracker) {
                    await iOSDeviceTracker.start();
                }
                await androidDeviceTracker.start();
                await networkInspector.start(adbHelper);
                vscode.commands.executeCommand(
                    "setContext",
                    CONTEXT_VARIABLES_NAMES.IS_RNT_NETWORK_INSPECTOR_RUNNING,
                    true,
                );
            } catch (err) {
                await CommandPaletteHandler.stopNetworkInspector();
                throw err;
            }
        } else {
            this.logger.info(
                localize(
                    "AnotherNetworkInspectorAlreadyRun",
                    "Another Network inspector is already running",
                ),
            );
        }
    }

    public static async stopNetworkInspector(): Promise<void> {
        if (CommandPaletteHandler.networkInspectorModule) {
            CommandPaletteHandler.networkInspectorModule.androidDeviceTracker.stop();
            if (CommandPaletteHandler.networkInspectorModule.iOSDeviceTracker) {
                CommandPaletteHandler.networkInspectorModule.iOSDeviceTracker.stop();
            }
            await CommandPaletteHandler.networkInspectorModule.networkInspector.stop();
            CommandPaletteHandler.networkInspectorModule = null;
            InspectorViewFactory.clearCache();
        }
        vscode.commands.executeCommand(
            "setContext",
            CONTEXT_VARIABLES_NAMES.IS_RNT_NETWORK_INSPECTOR_RUNNING,
            false,
        );
    }

    public static getPlatformByCommandName(commandName: string): string {
        commandName = commandName.toLocaleLowerCase();

        if (commandName.indexOf(PlatformType.Android) > -1) {
            return PlatformType.Android;
        }

        if (commandName.indexOf(PlatformType.iOS) > -1) {
            return PlatformType.iOS;
        }

        if (commandName.indexOf(PlatformType.Exponent) > -1) {
            return PlatformType.Exponent;
        }

        return "";
    }

    public static startLogCatMonitor(): Promise<void> {
        TipNotificationService.getInstance().setKnownDateForFeatureById("logCatMonitor");
        return this.selectProject().then(appLauncher => {
            const projectPath = appLauncher.getPackager().getProjectPath();
            const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
            const adbHelper = new AdbHelper(projectPath, nodeModulesRoot);

            const avdManager = new AndroidEmulatorManager(adbHelper);
            return avdManager.selectOnlineDevice().then(deviceId => {
                if (deviceId) {
                    LogCatMonitorManager.delMonitor(deviceId); // Stop previous logcat monitor if it's running
                    let logCatArguments = SettingsHelper.getLogCatFilteringArgs(
                        appLauncher.getWorkspaceFolderUri(),
                    );
                    // this.logCatMonitor can be mutated, so we store it locally too
                    let logCatMonitor = new LogCatMonitor(deviceId, adbHelper, logCatArguments);
                    LogCatMonitorManager.addMonitor(logCatMonitor);
                    logCatMonitor
                        .start() // The LogCat will continue running forever, so we don't wait for it
                        .catch(() =>
                            this.logger.warning(
                                localize(
                                    "ErrorWhileMonitoringLogCat",
                                    "Error while monitoring LogCat",
                                ),
                            ),
                        );
                } else {
                    vscode.window.showErrorMessage(
                        localize(
                            "OnlineAndroidDeviceNotFound",
                            "Could not find a proper online Android device to start a LogCat monitor",
                        ),
                    );
                }
            });
        });
    }

    public static stopLogCatMonitor(): Promise<void> {
        return this.selectLogCatMonitor().then(monitor => {
            LogCatMonitorManager.delMonitor(monitor.deviceId);
        });
    }

    public static async selectAndInsertDebugConfiguration(
        configurationProvider: ReactNativeDebugConfigProvider,
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
    ): Promise<void> {
        if (
            vscode.window.activeTextEditor &&
            vscode.window.activeTextEditor.document === document
        ) {
            const folder = vscode.workspace.getWorkspaceFolder(document.uri);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const config = await configurationProvider.provideDebugConfigurationSequentially!(
                folder,
                token,
            );

            if (!token.isCancellationRequested && config) {
                // Always use the first available debug configuration.
                const cursorPosition = LaunchJsonCompletionHelper.getCursorPositionInConfigurationsArray(
                    document,
                    position,
                );
                if (!cursorPosition) {
                    return;
                }
                const commaPosition = LaunchJsonCompletionHelper.isCommaImmediatelyBeforeCursor(
                    document,
                    position,
                )
                    ? "BeforeCursor"
                    : undefined;
                const formattedJson = LaunchJsonCompletionHelper.getTextForInsertion(
                    config,
                    cursorPosition,
                    commaPosition,
                );
                const workspaceEdit = new vscode.WorkspaceEdit();
                workspaceEdit.insert(document.uri, position, formattedJson);
                await vscode.workspace.applyEdit(workspaceEdit);
                vscode.commands.executeCommand("editor.action.formatDocument").then(
                    () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
                    () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
                );
            }
        }
    }

    private static trustedWorkspaceRequired(
        projectRoot: string,
        limitedItemName: string,
    ): Promise<void> {
        if (isWorkspaceTrusted()) {
            return Promise.resolve();
        } else {
            return Promise.reject(
                ErrorHelper.getInternalError(
                    InternalErrorCode.WorkspaceIsNotTrusted,
                    projectRoot,
                    limitedItemName,
                ),
            );
        }
    }

    private static createPlatform(
        appLauncher: AppLauncher,
        platform: PlatformType,
        platformClass: typeof GeneralMobilePlatform,
        target?: TargetType,
    ): GeneralMobilePlatform {
        const runOptions = CommandPaletteHandler.getRunOptions(appLauncher, platform, target);
        runOptions.nodeModulesRoot = appLauncher.getOrUpdateNodeModulesRoot();

        return new platformClass(runOptions, {
            packager: appLauncher.getPackager(),
        });
    }

    private static runRestartPackagerCommandAndUpdateStatus(
        appLauncher: AppLauncher,
    ): Promise<void> {
        return appLauncher
            .getPackager()
            .restart(SettingsHelper.getPackagerPort(appLauncher.getWorkspaceFolderUri().fsPath));
    }

    /**
     * Ensures that we are in a React Native project and then executes the operation
     * Otherwise, displays an error message banner
     * {operation} - a function that performs the expected operation
     */
    private static executeCommandInContext(
        rnCommand: string,
        workspaceFolder: vscode.WorkspaceFolder,
        operation: () => Promise<void>,
    ): Promise<void> {
        const extProps = {
            platform: {
                value: CommandPaletteHandler.getPlatformByCommandName(rnCommand),
                isPii: false,
            },
        };

        return TelemetryHelper.generate("RNCommand", extProps, generator => {
            generator.add("command", rnCommand, false);
            const projectRoot = SettingsHelper.getReactNativeProjectRoot(
                workspaceFolder.uri.fsPath,
            );
            this.logger.debug(`Command palette: run project ${projectRoot} in context`);
            return ReactNativeProjectHelper.isReactNativeProject(projectRoot).then(isRNProject => {
                generator.add("isRNProject", isRNProject, false);
                if (isRNProject) {
                    // Bring the log channel to focus
                    this.logger.setFocusOnLogChannel();

                    // Execute the operation
                    return operation();
                } else {
                    vscode.window.showErrorMessage(
                        `${projectRoot} workspace is not a React Native project.`,
                    );
                    return;
                }
            });
        });
    }

    /**
     * Publish project to exponent server. In order to do this we need to make sure the user is logged in exponent and the packager is running.
     */
    private static executePublishToExpHost(appLauncher: AppLauncher): Promise<boolean> {
        CommandPaletteHandler.logger.info(
            localize(
                "PublishingAppToExponentServer",
                "Publishing app to Expo server. This might take a moment.",
            ),
        );
        return this.loginToExponent(appLauncher).then(user => {
            CommandPaletteHandler.logger.debug(`Publishing as ${user.username}...`);
            return this.runExponent()
                .then(() => XDL.publish(appLauncher.getWorkspaceFolderUri().fsPath))
                .then(response => {
                    if (response.err || !response.url) {
                        return false;
                    }
                    const publishedOutput = localize(
                        "ExpoAppSuccessfullyPublishedTo",
                        "Expo app successfully published to {0}",
                        response.url,
                    );
                    CommandPaletteHandler.logger.info(publishedOutput);
                    vscode.window.showInformationMessage(publishedOutput);
                    return true;
                });
        });
    }

    private static loginToExponent(appLauncher: AppLauncher): Promise<XDL.IUser> {
        return appLauncher
            .getExponentHelper()
            .loginToExponent(
                (message, password) => {
                    return new Promise((resolve, reject) => {
                        vscode.window
                            .showInputBox({ placeHolder: message, password: password })
                            .then(login => {
                                resolve(login || "");
                            }, reject);
                    });
                },
                message => {
                    return new Promise((resolve, reject) => {
                        vscode.window.showInformationMessage(message).then(password => {
                            resolve(password || "");
                        }, reject);
                    });
                },
            )
            .catch(err => {
                CommandPaletteHandler.logger.warning(
                    localize(
                        "ExpoErrorOccuredMakeSureYouAreLoggedIn",
                        "An error has occured. Please make sure you are logged in to Expo, your project is setup correctly for publishing and your packager is running as Expo.",
                    ),
                );
                throw err;
            });
    }

    private static selectProject(): Promise<AppLauncher> {
        let keys = Object.keys(ProjectsStorage.projectsCache);
        if (keys.length > 1) {
            return new Promise((resolve, reject) => {
                vscode.window.showQuickPick(keys).then(selected => {
                    if (selected) {
                        this.logger.debug(`Command palette: selected project ${selected}`);
                        resolve(ProjectsStorage.projectsCache[selected]);
                    }
                }, reject);
            });
        } else if (keys.length === 1) {
            this.logger.debug(`Command palette: once project ${keys[0]}`);
            return Promise.resolve(ProjectsStorage.projectsCache[keys[0]]);
        } else {
            return Promise.reject(
                ErrorHelper.getInternalError(
                    InternalErrorCode.WorkspaceNotFound,
                    "Current workspace does not contain React Native projects.",
                ),
            );
        }
    }

    private static selectLogCatMonitor(): Promise<LogCatMonitor> {
        let keys = Object.keys(LogCatMonitorManager.logCatMonitorsCache);
        if (keys.length > 1) {
            return new Promise((resolve, reject) => {
                vscode.window.showQuickPick(keys).then(selected => {
                    if (selected) {
                        this.logger.debug(`Command palette: selected LogCat monitor ${selected}`);
                        resolve(LogCatMonitorManager.logCatMonitorsCache[selected]);
                    }
                }, reject);
            });
        } else if (keys.length === 1) {
            this.logger.debug(`Command palette: once LogCat monitor ${keys[0]}`);
            return Promise.resolve(LogCatMonitorManager.logCatMonitorsCache[keys[0]]);
        } else {
            return Promise.reject(
                ErrorHelper.getInternalError(
                    InternalErrorCode.AndroidCouldNotFindActiveLogCatMonitor,
                ),
            );
        }
    }

    private static getRunOptions(
        appLauncher: AppLauncher,
        platform: PlatformType,
        target: TargetType = "simulator",
    ): IAndroidRunOptions | IIOSRunOptions | IWindowsRunOptions | ImacOSRunOptions {
        const packagerPort = SettingsHelper.getPackagerPort(
            appLauncher.getWorkspaceFolderUri().fsPath,
        );
        const runArgs = SettingsHelper.getRunArgs(
            platform,
            target,
            appLauncher.getWorkspaceFolderUri(),
        );
        const envArgs = SettingsHelper.getEnvArgs(
            platform,
            target,
            appLauncher.getWorkspaceFolderUri(),
        );
        const envFile = SettingsHelper.getEnvFile(
            platform,
            target,
            appLauncher.getWorkspaceFolderUri(),
        );
        const projectRoot = SettingsHelper.getReactNativeProjectRoot(
            appLauncher.getWorkspaceFolderUri().fsPath,
        );
        const nodeModulesRoot: string = appLauncher.getOrUpdateNodeModulesRoot();
        const runOptions:
            | IAndroidRunOptions
            | IIOSRunOptions
            | IWindowsRunOptions
            | ImacOSRunOptions = {
            platform: platform,
            workspaceRoot: appLauncher.getWorkspaceFolderUri().fsPath,
            projectRoot: projectRoot,
            packagerPort: packagerPort,
            runArguments: runArgs,
            env: envArgs,
            envFile: envFile,
            reactNativeVersions: appLauncher.getReactNativeVersions() || {
                reactNativeVersion: "",
                reactNativeWindowsVersion: "",
                reactNativeMacOSVersion: "",
            },
            nodeModulesRoot,
        };

        if (platform === PlatformType.iOS && target === "device") {
            runOptions.target = "device";
        }

        CommandExecutor.ReactNativeCommand = SettingsHelper.getReactNativeGlobalCommandName(
            appLauncher.getWorkspaceFolderUri(),
        );

        return runOptions;
    }
}
