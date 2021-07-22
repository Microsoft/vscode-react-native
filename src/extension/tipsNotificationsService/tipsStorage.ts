// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
import * as nls from "vscode-nls";

nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize = nls.loadMessageBundle();

export default {
    generalTips: {
        elementInspector: {
            text: localize(
                "TipElementInspector",
                "You can use Element Inspector provided by the RNT extension to inspect application UI elements with development tools. To try it out, just start “Run Element Inspector” command in Command Palette",
            ),
            anchorLink: "#element-inspector",
        },
        logCatMonitor: {
            text: localize(
                "TipLogCatMonitor",
                "You can create a LogCat Monitor provided by the RNT extension for the chosen online Android device to see the device LogCat logs. To try it out, just start “Run React Native LogCat Monitor” command in Command Palette",
            ),
            anchorLink: "#configure-an-android-logcat-monitor",
        },
        networkInspector: {
            text: localize(
                "TipNetworkInspector",
                "You can use Network Inspector provided by the RNT extension to inspect network traffic of your app. To try it out, just start “Run Network Inspector” command in Command Palette",
            ),
            anchorLink: "#network-inspector",
        },
        directDebuggingWithHermes: {
            text: localize(
                "TipDirectDebuggingWithHermes",
                "You can use direct debugging via the RNT extension for your apps with Hermes engine. To try it out, just add appropriate debug scenarios",
            ),
            anchorLink: "#hermes-engine",
        },
        debuggingRNWAndMacOSApps: {
            text: localize(
                "TipDebuggingRNWAndMacOSApps",
                "You can debug React Native Windows and React Native Macos apps via the RNT extension. To try it out, just add appropriate debug scenarios",
            ),
            anchorLink: "#react-native-for-windows",
        },
        expoHostType: {
            text: localize(
                "TipExpoHostType",
                "You can configure the connection type (LAN, Tunnel or Local) to be used on Expo debugging to communicate with a device or an emulator by  specifying `expoHostType` parameter in your debug configuration",
            ),
            anchorLink: "#expo-applications",
        },
        customEnvVariables: {
            text: localize(
                "TipCustomEnvVariables",
                "RNT extension supports passing custom environment variables to the RN Packager process context. You can do this by adding custom variables to `.env` file in the root folder of your project",
            ),
            anchorLink: "#custom-environment-variables",
        },
    },
    specificTips: {
        networkInspectorLogsColorTheme: {
            text: localize(
                "TipNetworkInspectorLogsColorTheme",
                "The extension provides “Dark” and “Light” color themes for Network Inspector logs. You can change the theme in the extension configuration in the Settings tab",
            ),
            anchorLink: "#network-inspector-logs-theme",
        },
    },
};
