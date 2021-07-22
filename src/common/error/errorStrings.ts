// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
import * as nls from "vscode-nls";
import { InternalErrorCode } from "./internalErrorCode";
nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize = nls.loadMessageBundle();

export const ERROR_STRINGS = {
    [InternalErrorCode.CommandFailed]: localize(
        "CommandFailed",
        "Error while executing command '{0}'",
    ),
    [InternalErrorCode.CommandFailedWithDetails]: localize(
        "CommandFailed",
        "Error while executing command '{0}'.\nDetails: {1}",
    ),
    [InternalErrorCode.CommandFailedWithErrorCode]: localize(
        "CommandFailedWithErrorCode",
        "Command '{0}' failed with error code {1}",
    ),
    [InternalErrorCode.ExpectedIntegerValue]: localize(
        "ExpectedIntegerValue",
        "Expected an integer. Couldn't read {0}",
    ),
    [InternalErrorCode.PackagerStartFailed]: localize(
        "PackagerStartFailed",
        "Error while executing React Native Packager.",
    ),
    [InternalErrorCode.IOSDeployNotFound]: localize(
        "IOSDeployNotFound",
        "Unable to find ios-deploy. Please make sure to install it globally('brew install ios-deploy')",
    ),
    [InternalErrorCode.DeviceNotPluggedIn]: localize(
        "DeviceNotPluggedIn",
        "Unable to mount developer disk image.",
    ),
    [InternalErrorCode.DeveloperDiskImgNotMountable]: localize(
        "DeveloperDiskImgNotMountable",
        "Unable to mount developer disk image.",
    ),
    [InternalErrorCode.ApplicationLaunchFailed]: localize(
        "ApplicationLaunchFailed",
        "An error occurred while launching the application. {0}",
    ),
    [InternalErrorCode.CouldNotAttachToDebugger]: localize(
        "CouldNotAttachToDebugger",
        "An error occurred while attaching debugger to the application. {0}",
    ),
    [InternalErrorCode.ApplicationLaunchTimedOut]: localize(
        "ApplicationLaunchTimedOut",
        "Timeout launching application. Is the device locked?",
    ),
    [InternalErrorCode.IOSSimulatorNotLaunchable]: localize(
        "IOSSimulatorNotLaunchable",
        "Unable to launch iOS simulator. Try specifying a different target.",
    ),
    [InternalErrorCode.OpnPackagerLocationNotFound]: localize(
        "OpnPackagerLocationNotFound",
        "Opn package location not found",
    ),
    [InternalErrorCode.OpnPackagerNotFound]: localize(
        "OpnPackagerNotFound",
        "The package 'opn' was not found. {0}",
    ),
    [InternalErrorCode.PackageNotFound]: localize(
        "PackageNotFound",
        "Attempting to find package {0} failed with error: {1}",
    ),
    [InternalErrorCode.PlatformNotSupported]: localize(
        "PlatformNotSupported",
        "Platform '{0}' is not supported on host platform: {1}",
    ),
    [InternalErrorCode.ProjectVersionNotParsable]: localize(
        "ProjectVersionNotParsable",
        "Couldn't parse the version component of the package at {0}: version = {1}",
    ),
    [InternalErrorCode.ProjectVersionUnsupported]: localize(
        "ProjectVersionUnsupported",
        "Project version = {0}",
    ),
    [InternalErrorCode.CouldNotFindProjectVersion]: localize(
        "CouldNotFindProjectVersion",
        "Couldn't find React Native version in the current workspace or folder",
    ),
    [InternalErrorCode.ProjectVersionNotReadable]: localize(
        "ProjectVersionNotReadable",
        "Unable to read version = {0}",
    ),
    [InternalErrorCode.TelemetryInitializationFailed]: localize(
        "TelemetryInitializationFailed",
        "{0}. Couldn't initialize telemetry",
    ),
    [InternalErrorCode.ExtensionActivationFailed]: localize(
        "ExtensionActivationFailed",
        "Failed to activate the React Native Tools extension",
    ),
    [InternalErrorCode.DebuggerStubLauncherFailed]: localize(
        "DebuggerStubLauncherFailed",
        "Failed to setup the stub launcher for the debugger",
    ),
    [InternalErrorCode.IntellisenseSetupFailed]: localize(
        "IntellisenseSetupFailed",
        "Failed to setup IntelliSense",
    ),
    [InternalErrorCode.NodeDebuggerConfigurationFailed]: localize(
        "NodeDebuggerConfigurationFailed",
        "Failed to configure the node debugger location for the debugger",
    ),
    [InternalErrorCode.FailedToStopPackagerOnExit]: localize(
        "FailedToStopPackagerOnExit",
        "Failed to stop the packager while closing React Native Tools",
    ),
    [InternalErrorCode.FailedToRunOnAndroid]: localize(
        "FailedToRunOnAndroid",
        "Failed to run the application in Android",
    ),
    [InternalErrorCode.FailedToRunOnIos]: localize(
        "FailedToRunOnIos",
        "Failed to run the application in iOS",
    ),
    [InternalErrorCode.FailedToRunExponent]: localize(
        "FailedToRunExponent",
        "Failed to run the application in Expo",
    ),
    [InternalErrorCode.FailedToPublishToExpHost]: localize(
        "FailedToRunExponent",
        "Failed to publish the application to Exponent",
    ),
    [InternalErrorCode.FailedToStartPackager]: localize(
        "FailedToStartPackager",
        "Failed to start the React Native packager",
    ),
    [InternalErrorCode.FailedToStopPackager]: localize(
        "FailedToStopPackager",
        "Failed to stop the React Native packager",
    ),
    [InternalErrorCode.FailedToRestartPackager]: localize(
        "FailedToRestartPackager",
        "Failed to restart the React Native packager",
    ),
    [InternalErrorCode.DebuggingFailed]: localize("DebuggingFailed", "Cannot debug application"),
    [InternalErrorCode.DebuggingFailedInNodeWrapper]: localize(
        "DebuggingFailedInNodeWrapper",
        "Cannot debug application due to an error in the internal Node Debugger",
    ),
    [InternalErrorCode.RNTempFolderDeletionFailed]: localize(
        "RNTempFolderDeletionFailed",
        "Couldn't delete the temporary folder {0}",
    ),
    [InternalErrorCode.CouldNotFindLocationOfNodeDebugger]: localize(
        "CouldNotFindLocationOfNodeDebugger",
        "Couldn't find the location of the node-debugger extension",
    ),
    [InternalErrorCode.CouldNotFindWorkspace]: localize(
        "CouldNotFindWorkspace",
        "Couldn't find any workspace or React Native project folder",
    ),
    [InternalErrorCode.ReactNativePackageIsNotInstalled]: localize(
        "ReactNativePackageIsNotInstalled",
        'Couldn\'t find react-native package in node_modules. Please, run "npm install" inside your project to install it.',
    ),
    [InternalErrorCode.ReactNativeWindowsIsNotInstalled]: localize(
        "ReactNativeWindowsIsNotInstalled",
        "It appears you don't have 'react-native-windows' package installed. Please proceed to https://github.com/microsoft/react-native-windows#getting-started for more info.",
    ),
    [InternalErrorCode.PackagerRunningInDifferentPort]: localize(
        "PackagerRunningInDifferentPort",
        "A packager cannot be started on port {0} because a packager process is already running on port {1}",
    ),
    [InternalErrorCode.ErrorWhileProcessingMessageInIPMSServer]: localize(
        "ErrorWhileProcessingMessageInIPMSServer",
        "An error ocurred while handling message: {0}",
    ),
    [InternalErrorCode.ErrorNoPipeFound]: localize(
        "ErrorNoPipeFound",
        "Unable to set up communication with VSCode react-native extension. Is this a react-native project, and have you made sure that the react-native npm package is installed at the root?",
    ),
    [InternalErrorCode.NotAllSuccessPatternsMatched]: localize(
        "NotAllSuccessPatternsMatched",
        'Unknown error: not all success patterns were matched. \n It means that "react-native run-{0}" command failed. \n Please, check the View -> Toggle Output -> React Native, \n View -> Toggle Output -> React Native: Run {1} output windows.',
    ),
    [InternalErrorCode.CouldNotParsePackageVersion]: localize(
        "CouldNotParsePackageVersion",
        "Couldn't parse the version component of the package at {0}: version = {1}",
    ),
    [InternalErrorCode.UnsupportedCommandStatus]: localize(
        "UnsupportedCommandStatus",
        "Unsupported command status",
    ),
    [InternalErrorCode.ExpectedExponentTunnelPath]: localize(
        "ExpectedExponentTunnelPath",
        "No link provided by Expo. Is your project correctly setup?",
    ),
    [InternalErrorCode.WorkspaceNotFound]: localize(
        "WorkspaceNotFound",
        "Error while working with workspace: {0}",
    ),
    [InternalErrorCode.RNVersionNotSupportedByExponent]: localize(
        "RNVersionNotSupportedByExponent",
        "React Native version not supported by Expo. Major versions supported: {0}",
    ),
    [InternalErrorCode.UserCancelledExpoLogin]: localize(
        "UserCancelledExpoLogin",
        "User canceled login.",
    ),
    [InternalErrorCode.NgrokIsNotInstalledGlobally]: localize(
        "NgrokIsNotInstalledGlobally",
        'It seems that "@expo/ngrok" package isn\'t installed globally. This package is required to use Expo tunnels. Please run "npm i -g @expo/ngrok" to install it globally.',
    ),
    [InternalErrorCode.CannotAttachToPackagerCheckPackagerRunningOnPort]: localize(
        "CannotAttachToPackagerCheckPackagerRunningOnPort",
        "Cannot attach to packager. Are you sure there is a packager and it is running in the port {0}? If your packager is configured to run in another port make sure to add that to the settings.json.",
    ),
    [InternalErrorCode.AnotherDebuggerConnectedToPackager]: localize(
        "AnotherDebuggerConnectedToPackager",
        "Another debugger is already connected to packager. Please close it before trying to debug with VSCode.",
    ),
    [InternalErrorCode.NotInReactNativeFolderError]: localize(
        "NotInReactNativeFolderError",
        "Seems to be that you are trying to debug from within directory that is not a React Native project root. \n If so, please, follow these instructions: https://github.com/microsoft/vscode-react-native#customization",
    ),
    [InternalErrorCode.SourcesStoragePathIsNullOrEmpty]: localize(
        "SourcesStoragePathIsNullOrEmpty",
        "The sourcesStoragePath argument was null or empty",
    ),
    [InternalErrorCode.AndroidCouldNotInstallTheAppOnAnyAvailibleDevice]: localize(
        "AndroidCouldNotInstallTheAppOnAnyAvailibleDevice",
        "Could not install the app on any available device. Make sure you have a correctly \n configured device or emulator running. See https://facebook.github.io/react-native/docs/android-setup.html.",
    ),
    [InternalErrorCode.AndroidShellCommandTimedOut]: localize(
        "AndroidShellCommandTimedOut",
        "An Android shell command timed-out. Please retry the operation.",
    ),
    [InternalErrorCode.AndroidProjectNotFound]: localize(
        "AndroidProjectNotFound",
        "Android project not found.",
    ),
    [InternalErrorCode.AndroidMoreThanOneDeviceOrEmulator]: localize(
        "AndroidMoreThanOneDeviceOrEmulator",
        "More than one device/emulator",
    ),
    [InternalErrorCode.AndroidFailedToLaunchTheSpecifiedActivity]: localize(
        "AndroidFailedToLaunchTheSpecifiedActivity",
        "Failed to launch the specified activity. Try running application manually and start debugging using 'Attach to packager' launch configuration.",
    ),
    [InternalErrorCode.IOSFoundMoreThanOneExecutablesCleanupBuildFolder]: localize(
        "IOSFoundMoreThanOneExecutablesCleanupBuildFolder",
        "Found more than one executables in {0}. Please cleanup build folder or setup 'productName' launch option.",
    ),
    [InternalErrorCode.IOSCouldNotFoundExecutableInFolder]: localize(
        "IOSCouldNotFoundExecutableInFolder",
        "Could not found executable in {0}",
    ),
    [InternalErrorCode.WinRNMPPluginIsNotInstalled]: localize(
        "WinRNMPPluginIsNotInstalled",
        "'rnpm-plugin-windows' is not installed.",
    ),
    [InternalErrorCode.WinRunCommandFailed]: localize(
        "WinRunCommandFailed",
        "{0}\nPlease check the 'React Native: Run Windows' output channel for detales",
    ),
    [InternalErrorCode.ReactDevtoolsIsNotInstalled]: localize(
        "ReactDevtoolsIsNotInstalled",
        "React Devtools is not installed. Run `npm install -g react-devtools` command in your terminal to install it.",
    ),
    [InternalErrorCode.CancellationTokenTriggered]: localize(
        "CancellationTokenTriggered",
        "Operation canceled",
    ),
    [InternalErrorCode.WorkspaceIsNotTrusted]: localize(
        "WorkspaceIsNotTrusted",
        'The workspace by the project path "{0}" should be trusted to use "{1}"',
    ),
    [InternalErrorCode.DebuggingWontWorkReloadJSAndReconnect]: localize(
        "DebuggingWontWorkReloadJSAndReconnect",
        "{0}. Debugging won't work: Try reloading the JS from inside the app, or Reconnect the VS Code debugger",
    ),
    [InternalErrorCode.ReconnectionToPackagerFailedCheckForErrorsOrRestartReactNative]: localize(
        "ReconnectionToPackagerFailedCheckForErrorsOrRestartReactNative",
        "Reconnection to the proxy (Packager) failed. Please check the output window for Packager errors, if any. If failure persists, please restart the React Native debugger.",
    ),
    [InternalErrorCode.FailedToProcessMessageFromReactNativeApp]: localize(
        "FailedToProcessMessageFromReactNativeApp",
        "Failed to process message from the React Native app. Message:\n{0}",
    ),
    [InternalErrorCode.FailedToPrepareJSRuntimeEnvironment]: localize(
        "FailedToPrepareJSRuntimeEnvironment",
        "Failed to prepare the JavaScript runtime environment. Message:\n{0}",
    ),
    [InternalErrorCode.FailedToSendMessageToTheReactNativeApp]: localize(
        "FailedToSendMessageToTheReactNativeApp",
        "Failed to send message to the React Native app. Message:\n{0}",
    ),
    [InternalErrorCode.ReactNativeWorkerProcessThrownAnError]: localize(
        "ReactNativeWorkerProcessThrownAnError",
        "React Native worker process thrown an error",
    ),
    [InternalErrorCode.CouldntImportScriptAt]: localize(
        "CouldntImportScriptAt",
        "Couldn't import script at <{0}>",
    ),
    [InternalErrorCode.RNMessageWithMethodExecuteApplicationScriptDoesntHaveURLProperty]: localize(
        "RNMessageWithMethodExecuteApplicationScriptDoesntHaveURLProperty",
        "RNMessage with method 'executeApplicationScript' doesn't have 'url' property",
    ),
    [InternalErrorCode.CouldNotConnectToDebugTarget]: localize(
        "CouldNotConnectToDebugTarget",
        "Could not connect to the debug target at {0}: {1}",
    ),
    [InternalErrorCode.IOSCouldNotFoundDeviceForDirectDebugging]: localize(
        "CannotAttachtoiOSDeviceDirectly",
        'Unable to find iOS target device/simulator. Please check that "Settings > Safari > Advanced > Web Inspector = ON" or try specifying a different "port" parameter in launch.json. Also, please make sure that \'target\' property in your debug scenario is defined correctly.',
    ),
    [InternalErrorCode.FailedToStartAndroidEmulator]: localize(
        "FailedToStartAndroidEmulator",
        'The command "emulator -avd {0}" threw an exception: {1}',
    ),
    [InternalErrorCode.VirtualDeviceSelectionError]: localize(
        "VirtualDeviceSelectionError",
        "Virtual device launch finished with an exception: {0}",
    ),
    [InternalErrorCode.ReactNativemacOSIsNotInstalled]: localize(
        "ReactNativemacOSIsNotInstalled",
        "It appears you don't have 'react-native-macos' package installed. Please proceed to https://microsoft.github.io/react-native-windows/docs/rnm-getting-started for more info.",
    ),
    [InternalErrorCode.AndroidCouldNotStartLogCatMonitor]: localize(
        "ErrorWhileStartMonitoringLogCat",
        "Error while starting monitoring LogCat",
    ),
    [InternalErrorCode.AndroidCouldNotStopLogCatMonitor]: localize(
        "ErrorWhileStopMonitoringLogCat",
        "Error while stopping monitoring LogCat",
    ),
    [InternalErrorCode.AndroidCouldNotFindActiveLogCatMonitor]: localize(
        "ErrorWhileSelectMonitoringLogCat",
        "No active Android LogCat monitors found",
    ),
    [InternalErrorCode.CouldNotDirectDebugWithoutHermesEngine]: localize(
        "CouldNotDirectDebugWithoutHermesEngine",
        "Could not start direct debugging of the {0} application without Hermes engine enabled. Please check if Hermes engine is enabled in your project and your debugging configuration contains 'useHermesEngine' prop set to 'true'",
    ),
    [InternalErrorCode.CouldNotStartNetworkInspector]: localize(
        "ErrorWhileStartNetworkInspector",
        "Error while starting Network inspector",
    ),
    [InternalErrorCode.CouldNotStopNetworkInspector]: localize(
        "ErrorWhileStopNetworkInspector",
        "Error while stopping Network inspector",
    ),
};
