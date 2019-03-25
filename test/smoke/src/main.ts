// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as fs from "fs";
import * as path from "path";
import * as setupEnvironmentHelper from "./helpers/setupEnvironmentHelper";
import { SpectronApplication, Quality } from "./spectron/application";
import { setup as setupReactNativeDebugAndroidTests } from "./debugAndroid.test";
import { appiumHelper } from "./helpers/appiumHelper";
import { smokeTestsConstants } from "./helpers/smokeTestsConstants";

function fail(errorMessage): void {
    console.error(errorMessage);
    setupEnvironmentHelper.terminateAndroidEmulator();
    appiumHelper.terminateAppium();
    process.exit(1);
}

if (parseInt(process.version.substr(1), 10) < 8) {
    fail("Please update your Node version to greater than 8 to run the smoke test.");
}

function getBuildElectronPath(root: string): string {
    switch (process.platform) {
        case "darwin":
            return path.join(root, "Visual Studio Code.app", "Contents", "MacOS", "Electron");
        case "linux": {
            const product = require(path.join(root, "resources", "app", "product.json"));
            return path.join(root, product.applicationName);
        }
        case "win32": {
            const product = require(path.join(root, "resources", "app", "product.json"));
            return path.join(root, `${product.nameShort}.exe`);
        }
        default:
            throw new Error(`Platform ${process.platform} isn't supported`)
    }
}

function getVSCodeExecutablePath(testVSCodeFolder: string, isInsiders: boolean) {
    switch (process.platform) {
        case "darwin":
            return isInsiders
                ?
                path.join(testVSCodeFolder, "Visual Studio Code - Insiders.app", "Contents", "Resources", "app", "bin", "code")
                :
                path.join(testVSCodeFolder, "Visual Studio Code.app", "Contents", "Resources", "app", "bin", "code");
        case "win32":
            return isInsiders
                ?
                path.join(testVSCodeFolder, "bin", "code-insiders.cmd")
                :
                path.join(testVSCodeFolder, "bin", "code.cmd");
        case "linux":
            return isInsiders
                ?
                path.join(testVSCodeFolder, "bin", "code-insiders")
                :
                path.join(testVSCodeFolder, "bin", "code");
        default:
            throw new Error(`Platform ${process.platform} isn't supported`);
    }
}

const repoRoot = path.join(__dirname, "..", "..", "..");
const resourcesPath = path.join(__dirname, "..", "resources");
const isInsiders = process.env.CODE_VERSION === "insiders";
let testVSCodeDirectory;
if (!isInsiders) {
     testVSCodeDirectory = path.join(repoRoot, ".vscode-test", "stable");
} else {
    testVSCodeDirectory = path.join(repoRoot, ".vscode-test", "insiders");
}

let electronExecutablePath: string;

let quality: Quality;
if (isInsiders) {
    quality = Quality.Insiders;
} else {
    quality = Quality.Stable;
}

/**
 * WebDriverIO 4.8.0 outputs all kinds of "deprecation" warnings
 * for common commands like `keys` and `moveToObject`.
 * According to https://github.com/Codeception/CodeceptJS/issues/531,
 * these deprecation warnings are for Firefox, and have no alternative replacements.
 * Since we can't downgrade WDIO as suggested (it's Spectron's dep, not ours),
 * we must suppress the warning with a classic monkey-patch.
 *
 * @see webdriverio/lib/helpers/depcrecationWarning.js
 * @see https://github.com/webdriverio/webdriverio/issues/2076
 */
// Filter out the following messages:
const wdioDeprecationWarning = /^WARNING: the "\w+" command will be deprecated soon../; // [sic]
// Monkey patch:
const warn = console.warn;
console.warn = function suppressWebdriverWarnings(message) {
    if (wdioDeprecationWarning.test(message)) { return; }
    warn.apply(console, arguments);
};

const RNAppName = "latestRNApp";
const RNworkspacePath = path.join(resourcesPath, RNAppName);
const RNworkspaceFilePath = path.join(RNworkspacePath, "App.js");
const ExpoAppName = "latestExpoApp";
export const ExpoWorkspacePath = path.join(resourcesPath, ExpoAppName);
const ExpoWorkspaceFilePath = path.join(ExpoWorkspacePath, "App.js");
const userDataDir = path.join(testVSCodeDirectory, "userTmpFolder");
const artifactsPath = path.join(repoRoot, "SmokeTestLogs");

const extensionsPath = path.join(testVSCodeDirectory, "extensions");

const keybindingsPath = path.join(userDataDir, "keybindings.json");
process.env.VSCODE_KEYBINDINGS_PATH = keybindingsPath;

function createApp(quality: Quality): SpectronApplication | null {

    if (!electronExecutablePath) {
        return null;
    }

    console.log(`*** Executing ${electronExecutablePath} with Spectron`);
    return new SpectronApplication({
        quality,
        electronPath: electronExecutablePath,
        workspacePath: RNworkspacePath,
        userDataDir,
        extensionsPath,
        artifactsPath,
        workspaceFilePath: RNworkspaceFilePath,
        waitTime:  smokeTestsConstants.spectronElementResponseTimeout,
    });
}

async function setup(): Promise<void> {
    console.log("*** Test VS Code directory:", testVSCodeDirectory);
    console.log("*** Preparing smoke tests setup...");
    appiumHelper.runAppium();

    await setupEnvironmentHelper.runAndroidEmulator();
    setupEnvironmentHelper.prepareReactNativeApplication(RNworkspaceFilePath, resourcesPath, RNworkspacePath, RNAppName);
    setupEnvironmentHelper.prepareExpoApplication(ExpoWorkspaceFilePath, resourcesPath, ExpoWorkspacePath, ExpoAppName);
    await setupEnvironmentHelper.installExpoAppOnAndroid(ExpoWorkspacePath);
    await setupEnvironmentHelper.downloadVSCodeExecutable(repoRoot);

    electronExecutablePath = getBuildElectronPath(testVSCodeDirectory);
    if (!fs.existsSync(testVSCodeDirectory || "")) {
        fail(`Can't find VS Code executable at ${testVSCodeDirectory}.`);
    }
    const testVSCodeExecutablePath = getVSCodeExecutablePath(testVSCodeDirectory, isInsiders);
    setupEnvironmentHelper.installExtensionFromVSIX(extensionsPath, testVSCodeExecutablePath, resourcesPath, isInsiders);

    if (!fs.existsSync(userDataDir)) {
        console.log(`*** Creating VS Code user data directory: ${userDataDir}`);
        fs.mkdirSync(userDataDir);
    }
    await setupEnvironmentHelper.fetchKeybindings(keybindingsPath);
    console.log("*** Smoke tests setup done!\n");
}

before(async function () {
    if (process.argv.includes("--skip-setup")) {
        console.log("*** --skip-setup parameter is set, skipping clean up and apps installation");
        // Assume that VS Code is already installed
        electronExecutablePath = getBuildElectronPath(testVSCodeDirectory);
        return;
    }
    this.timeout(smokeTestsConstants.smokeTestSetupAwaitTimeout);
    setupEnvironmentHelper.cleanUp(path.join(testVSCodeDirectory), [RNworkspacePath, ExpoWorkspacePath]);
    try {
        await setup();
    } catch (err) {
        fail(err);
    }
});

describe("Test React Native extension debug scenarios", () => {
    before(async function () {
        const app = createApp(quality);
        await app!.start();
        this.app = app;
    });

    after(async function () {
        await this.app.stop();
        setupEnvironmentHelper.terminateAndroidEmulator();
        appiumHelper.terminateAppium();
    });

    setupReactNativeDebugAndroidTests();
});
