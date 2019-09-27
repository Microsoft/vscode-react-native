// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as path from "path";
import * as utilities from "./utilities";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as cp from "child_process";
import * as semver from "semver";
import * as kill from "tree-kill";
import * as os from "os";
import { IosSimulatorHelper } from "./iosSimulatorHelper";
import { sleep, filterProgressBarChars } from "./utilities";
import { AndroidEmulatorHelper } from "./androidEmulatorHelper";

export class SetupEnvironmentHelper {

    public static expoPackageName = "host.exp.exponent";
    public static expoBundleId = "host.exp.Exponent";
    public static iOSExpoAppsCacheDir = `${os.homedir()}/.expo/ios-simulator-app-cache`;

    public static  prepareReactNativeApplication(workspaceFilePath: string, resourcesPath: string, workspacePath: string, appName: string, customEntryPointFolder: string, version?: string) {
        let command = `react-native init ${appName}`;
        if (version) {
            command += ` --version ${version}`;
        }
        console.log(`*** Creating RN app via '${command}' in ${workspacePath}...`);
        cp.execSync(command, { cwd: resourcesPath, stdio: "inherit" });

        let customEntryPointFile = path.join(resourcesPath, customEntryPointFolder, "App.js");
        let launchConfigFile = path.join(resourcesPath, "launch.json");
        let vsCodeConfigPath = path.join(workspacePath, ".vscode");

        console.log(`*** Copying  ${customEntryPointFile} into ${workspaceFilePath}...`);
        fs.writeFileSync(workspaceFilePath, fs.readFileSync(customEntryPointFile));

        if (!fs.existsSync(vsCodeConfigPath)) {
            console.log(`*** Creating  ${vsCodeConfigPath}...`);
            fs.mkdirSync(vsCodeConfigPath);
        }

        console.log(`*** Copying  ${launchConfigFile} into ${vsCodeConfigPath}...`);
        fs.writeFileSync(path.join(vsCodeConfigPath, "launch.json"), fs.readFileSync(launchConfigFile));

        SetupEnvironmentHelper.patchMetroConfig(workspacePath);
    }

    public static  prepareHermesReactNativeApplication(workspaceFilePath: string, resourcesPath: string, workspacePath: string, appName: string, customEntryPointFolder: string, version?: string) {
        let commandClean = path.join(workspacePath, "android", "gradlew");

        console.log(`*** Executing  ${commandClean}...`);
        cp.spawnSync(commandClean, ["clean"], { cwd: path.join(workspacePath, "android"), stdio: "inherit" });

        let customEntryPointFile = path.join(resourcesPath, customEntryPointFolder, "App.js");
        let testButtonPath = path.join(resourcesPath, customEntryPointFolder, "TestButton.js");

        console.log(`*** Copying  ${customEntryPointFile} into ${workspaceFilePath}...`);
        fs.writeFileSync(workspaceFilePath, fs.readFileSync(customEntryPointFile));

        SetupEnvironmentHelper.copyGradleFilesHermes(workspacePath, resourcesPath, customEntryPointFolder);

        console.log(`*** Copying ${testButtonPath} into ${workspacePath}`);
        fs.copyFileSync(testButtonPath, path.join(workspacePath, "TestButton.js"));

        // SetupEnvironmentHelper.patchMetroConfig(workspacePath);
    }

    public static prepareExpoApplication(workspaceFilePath: string, resourcesPath: string, workspacePath: string, appName: string) {
        const command = `echo -ne '\\n' | expo init -t tabs --name ${appName} ${appName}`;
        console.log(`*** Creating Expo app via '${command}' in ${workspacePath}...`);
        cp.execSync(command, { cwd: resourcesPath, stdio: "inherit" });

        const customEntryPointFile = path.join(resourcesPath, "ExpoSample", "App.js");
        const launchConfigFile = path.join(resourcesPath, "launch.json");
        const vsCodeConfigPath = path.join(workspacePath, ".vscode");

        console.log(`*** Copying  ${customEntryPointFile} into ${workspaceFilePath}...`);
        fs.writeFileSync(workspaceFilePath, fs.readFileSync(customEntryPointFile));

        if (!fs.existsSync(vsCodeConfigPath)) {
            console.log(`*** Creating  ${vsCodeConfigPath}...`);
            fs.mkdirSync(vsCodeConfigPath);
        }

        console.log(`*** Copying  ${launchConfigFile} into ${vsCodeConfigPath}...`);
        fs.writeFileSync(path.join(vsCodeConfigPath, "launch.json"), fs.readFileSync(launchConfigFile));

        SetupEnvironmentHelper.patchMetroConfig(workspacePath);
    }

    public static addExpoDependencyToRNProject(workspacePath: string, version?: string) {
        let npmCmd = "npm";
        if (process.platform === "win32") {
            npmCmd = "npm.cmd";
        }

        let expoPackage: string = version ? `expo@${version}` : "expo";
        const command = `${npmCmd} install ${expoPackage} --save-dev`;

        console.log(`*** Adding expo dependency to ${workspacePath} via '${command}' command...`);
        cp.execSync(command, { cwd: workspacePath, stdio: "inherit" });
    }

    public static cleanUp(testVSCodeDirectory: string, testLogsDirectory: string, workspacePaths: string[], iOSExpoAppsCacheDirectory: string) {
        console.log("\n*** Clean up...");
        if (fs.existsSync(testVSCodeDirectory)) {
            console.log(`*** Deleting test VS Code directory: ${testVSCodeDirectory}`);
            rimraf.sync(testVSCodeDirectory);
        }
        if (fs.existsSync(testLogsDirectory)) {
            console.log(`*** Deleting test logs directory: ${testLogsDirectory}`);
            rimraf.sync(testLogsDirectory);
        }
        workspacePaths.forEach(testAppFolder => {
            if (fs.existsSync(testAppFolder)) {
                console.log(`*** Deleting test application: ${testAppFolder}`);
                rimraf.sync(testAppFolder);
            }
        });
        if (fs.existsSync(iOSExpoAppsCacheDirectory)) {
            console.log(`*** Deleting iOS expo app cache directory: ${iOSExpoAppsCacheDirectory}`);
            rimraf.sync(iOSExpoAppsCacheDirectory);
        }
    }

    public static async getLatestSupportedRNVersionForExpo(): Promise<any> {
        console.log("*** Getting latest React Native version supported by Expo...");
        return new Promise((resolve, reject) => {
            utilities.getContents("https://exp.host/--/api/v2/versions", null, null, function (error, versionsContent) {
                if (error) {
                    reject(error);
                }
                try {
                   const content = JSON.parse(versionsContent);
                   if (content.sdkVersions) {
                       const maxSdkVersion = Object.keys(content.sdkVersions).sort((ver1, ver2) => {
                           if (semver.lt(ver1, ver2)) {
                               return 1;
                           } else if (semver.gt(ver1, ver2)) {
                               return -1;
                           }
                           return 0;
                       })[0];
                       if (content.sdkVersions[maxSdkVersion]) {
                           if (content.sdkVersions[maxSdkVersion].facebookReactNativeVersion) {
                               console.log(`*** Latest React Native version supported by Expo: ${content.sdkVersions[maxSdkVersion].facebookReactNativeVersion}`);
                               resolve(content.sdkVersions[maxSdkVersion].facebookReactNativeVersion as string);
                           }
                       }
                   }
                   reject("Received object is incorrect");
                } catch (error) {
                   reject(error);
                }
            });
        });
    }

    // Installs Expo app on Android device via "expo android" command
    public static async installExpoAppOnAndroid(expoAppPath: string) {
        console.log(`*** Installing Expo app (${this.expoPackageName}) on android emulator with 'expo-cli android' command`);
        let expoCliCommand = process.platform === "win32" ? "expo-cli.cmd" : "expo-cli";
        let installerProcess = cp.spawn(expoCliCommand, ["android"], {cwd: expoAppPath, stdio: "pipe"});
        installerProcess.stdout.on("data", (data) => {
            const string = filterProgressBarChars(data.toString().trim());
            if (string !== "") {
                console.log(`stdout: ${data.toString().trim()}`);
            }
        });
        installerProcess.stderr.on("data", (data) => {
            const string = filterProgressBarChars(data.toString().trim());
            if (string !== "") {
                console.error(`stderr: ${string}`);
            }
        });
        installerProcess.on("close", () => {
            console.log("*** expo-cli terminated");
        });
        installerProcess.on("error", (error) => {
            console.log("Error occurred in expo-cli process: ", error);
        });
        await AndroidEmulatorHelper.checkIfAppIsInstalled(this.expoPackageName, 100 * 1000);
        kill(installerProcess.pid, "SIGINT");
        await sleep(1000);
        AndroidEmulatorHelper.enableDrawPermitForApp(this.expoPackageName);
    }

    // Installs Expo app on iOS device via "expo install:ios" command
    public static async installExpoAppOnIos(expoAppPath: string) {
        return new Promise((resolve, reject) => {
            console.log(`*** Installing Expo app on iOS simulator with 'expo-cli install:ios' command`);
            let installerProcess = cp.spawn("expo-cli", ["client:install:ios"], {cwd: expoAppPath, stdio: "pipe"});
            installerProcess.stdout.on("data", (data) => {
                const string = filterProgressBarChars(data.toString().trim());
                if (string !== "") {
                    console.log(`stdout: ${string}`);
                }
            });
            installerProcess.stderr.on("data", (data) => {
                const string = filterProgressBarChars(data.toString().trim());
                if (string !== "") {
                    console.error(`stderr: ${string}`);
                }
            });
            installerProcess.on("close", () => {
                console.log("*** expo-cli terminated");
                resolve();
            });
            installerProcess.on("error", (error) => {
                console.log("Error occurred in expo-cli process: ", error);
                reject(error);
            });
        });
    }

    // Fix for https://github.com/expo/expo-cli/issues/951
    // TODO: Delete when bug will be fixed
    public static patchExpoSettingsFile(expoAppPath: string) {
        const settingsJsonPath = path.join(expoAppPath, ".expo", "settings.json");
        if (fs.existsSync(settingsJsonPath)) {
            console.log(`*** Patching ${settingsJsonPath}...`);
            let content = JSON.parse(fs.readFileSync(settingsJsonPath).toString());
            if (content.https === false) {
                console.log(`*** Deleting https: ${content.https} line...`);
                delete content.https;
                content = JSON.stringify(content, null, 2);
                fs.writeFileSync(settingsJsonPath, content);
            }
        }
    }

    // TODO: refactor this function to make it capable to accept debug configuration as a parameter
    public static addIosTargetToLaunchJson(workspacePath: string) {
        let launchJsonPath = path.join(workspacePath, ".vscode", "launch.json");
        console.log(`*** Implicitly adding target to "Debug iOS" config for ${launchJsonPath}`);
        let content = JSON.parse(fs.readFileSync(launchJsonPath).toString());
        let found = false;
        for (let i = 0; i < content.configurations.length; i++) {
            if (content.configurations[i].name === "Debug iOS") {
                found = true;
                content.configurations[i].target = IosSimulatorHelper.getDevice();
            }
        }
        if (!found) {
            throw new Error("Couldn't find \"Debug iOS\" configuration");
        }
        fs.writeFileSync(launchJsonPath, JSON.stringify(content, undefined, 4)); // Adds indentations
    }

    public static async runIosSimulator() {
        const device = <string>IosSimulatorHelper.getDevice();
        await this.terminateIosSimulator();
        // Wipe data on simulator
        await IosSimulatorHelper.eraseSimulator(device);
        console.log(`*** Executing iOS simulator with 'xcrun simctl boot "${device}"' command...`);
        await IosSimulatorHelper.bootSimulator(device);
        await sleep(15 * 1000);
    }

    public static async terminateIosSimulator() {
        const device = <string>IosSimulatorHelper.getDevice();
        await IosSimulatorHelper.shutdownSimulator(device);
    }

    public static installExpoXdlPackageToExtensionDir(extensionDir: any, packageVersion: string) {
        let npmCmd = "npm";
        if (process.platform === "win32") {
            npmCmd = "npm.cmd";
        }
        const command = `${npmCmd} install @expo/xdl@${packageVersion} --no-save`;

        console.log(`*** Adding @expo/xdl dependency to ${extensionDir} via '${command}' command...`);
        cp.execSync(command, { cwd: extensionDir, stdio: "inherit" });
    }

    public static async patchMetroConfig(appPath: string) {
        const metroConfigPath = path.join(appPath, "metro.config.js");
        console.log(`*** Patching  ${metroConfigPath}`);
        const patchContent = `
// Sometimes on Windows Metro fails to resolve files located at .vscode\.react directory and throws EPERM errors
// To avoid it this directory is added to black list for resolving by Metro
if (process.platform === "win32") {
    module.exports.resolver = {
        blacklistRE: /.*\.vscode\\\.react.*/
    };
}

// Redirect Metro cache
module.exports.cacheStores = [
    new (require('metro-cache')).FileStore({
        root: require('path').join(".cache", 'metro-cache'),
    }),
];

// Redirect Haste Map cache
module.exports.hasteMapCacheDirectory = ".cache";`;
        fs.appendFileSync(metroConfigPath, patchContent);
        const contentAfterPatching = fs.readFileSync(metroConfigPath);
        console.log(`*** Content of a metro.config.js after patching: ${contentAfterPatching}`);
    }

    private static copyGradleFilesHermes(workspacePath: string, resourcesPath: string, customEntryPointFolder: string) {
        let appGradleBuildFilePath = path.join(workspacePath, "android", "app", "build.gradle");
        let resGradleBuildFilePath = path.join(resourcesPath, customEntryPointFolder, "build.gradle");
        // let resReactGradleFilePath = path.join(resourcesPath, customEntryPointFolder, "react.gradle"); // must be removed after react-native package fix
        // let projReactGradleFilePath = path.join(workspacePath, "node_modules", "react-native", "react.gradle"); // must be removed after react-native package fix

        console.log(`*** Copying  ${resGradleBuildFilePath} into ${appGradleBuildFilePath}...`);
        fs.writeFileSync(appGradleBuildFilePath, fs.readFileSync(resGradleBuildFilePath));

        // console.log(`*** Copying  ${resReactGradleFilePath} into ${projReactGradleFilePath}...`); // must be removed after react-native package fix
        // fs.writeFileSync(projReactGradleFilePath, fs.readFileSync(resReactGradleFilePath));
    }
}
