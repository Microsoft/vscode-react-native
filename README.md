# React Native Tools

[![Build Status](https://dev.azure.com/vscode-webdiag-extensions/VS%20Code%20WebDiag%20extensions/_apis/build/status/%5BUnit%20tests%5D%20vscode-react-native%20%5Bmaster%5D?branchName=master)](https://dev.azure.com/vscode-webdiag-extensions/VS%20Code%20WebDiag%20extensions/_build/latest?definitionId=60&branchName=master)

Stable:
![Stable version](https://vsmarketplacebadge.apphb.com/version-short/msjsdiag.vscode-react-native.svg)
![VS Marketplace rating](https://vsmarketplacebadge.apphb.com/rating-star/msjsdiag.vscode-react-native.svg)

Preview:
![VS Marketplace version](https://vsmarketplacebadge.apphb.com/version-short/msjsdiag.vscode-react-native-preview.svg)
![VS Marketplace rating](https://vsmarketplacebadge.apphb.com/rating-star/msjsdiag.vscode-react-native-preview.svg)

## React Native Tools Preview

The extension has a [nightly version](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native-preview) which is released on a daily basis at 9 PM PST on each day that changes occur.
To avoid conflicts, if both extensions are installed - the only stable version will be activated. So to use the preview version it is needed to disable or remove the stable version and reload VS Code.

## About the extension

This VS Code extension provides a development environment for React Native projects.
Using this extension, you can **debug your code and quickly run `react-native` commands** from the command palette.

![React Native features](images/react-features.gif)

<!-- TABLE OF CONTENTS -->

# Table of Contents

- [React Native Tools Preview](#react-native-tools-preview)
- [About the extension](#about-the-extension)
- [Getting started](#getting-started)
- [React Native commands in the Command Palette](#react-native-commands-in-the-command-palette)
- [Debugging React Native applications](#debugging-react-native-applications)
  - [Hermes engine](#hermes-engine)
  - [iOS applications](#ios-applications)
    - [iOS devices](#ios-devices)
    - [Custom scheme for iOS apps](#custom-scheme-for-ios-apps)
    - [iOS direct debugging](#iOS-direct-debugging)
    - [iOS Hermes debugging](#ios-hermes-debugging)
  - [Expo applications](#expo-applications)
    - [Configuring Expo](#configuring-expo)
  - [Windows applications](#react-native-for-windows)
  - [macOS applications](#react-native-for-macos)
    - [macOS Hermes debugging](#macos-hermes-debugging)
  - [TypeScript and Haul based applications](#typescript-and-haul)
  - [Debugger configuration properties](#debugger-configuration-properties)
- [Customization](#customization)
  - [Logging](#logging)
  - [Build APK and generate bundle](#build-apk-and-generate-bundle)
  - [Specifying custom arguments for `react-native run-*` command](#specifying-custom-arguments-for-react-native-run--command)
  - [Setting up the React Native packager](#setting-up-the-react-native-packager)
  - [Change project root](#change-project-root)
  - [Configure an Android LogCat Monitor](#configure-an-android-logcat-monitor)
  - [Configure dependencies versions for debugging Expo projects](#configure-dependencies-versions-for-debugging-expo-projects)
  - [Configure custom key bindings for extension commands](#configure-custom-key-bindings-for-extension-commands)
- [Network Inspector](#network-inspector)
- [Developing inside a Docker Container](#developing-inside-a-docker-container)
- [Contributing](#contributing)
- [Known Issues](#known-issues)

# Getting started

Before going any further make sure that you:

- [have a working React Native environment](https://reactnative.dev/docs/environment-setup).
- are using [VS Code](https://code.visualstudio.com) and have [installed this extension from the Marketplace](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native).
- have your React Native project root folder open in VS Code.

Please notice that the extension uses `.vscode/.react` directory at the project root to store intermediate files required for debugging. Although these files usually get removed after debug session ends, you may want to add this directory to your project's `.gitignore` file.

# React Native commands in the Command Palette

In the Command Palette, type `React Native` and choose a command.

![React Native commands](images/command-palette.png)

The **Run Android** command triggers `react-native run-android` and starts your app for Android.

The **Run iOS** command similarly triggers `react-native run-ios` and starts your app in the iOS simulator (e.g. iPhone 6).

The **Packager** commands allow you to start/stop the [**Metro Bundler**](https://github.com/facebook/metro-bundler) (formerly React Packager).

The full list of commands is:

| Name                             | Description                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Launch Android Emulator          | Prompts you to select the name of the available emulator and launch it. If only one emulator is installed in the system, it will be selected automatically                                                                                 |
| Run Android on Emulator          | Run an Android application on Emulator. Launch order: check target platform support, load run arguments, start Packager, run app in all connected emulators                                                                                |
| Run Android on Device            | Run an Android application on Device. Launch order: check target platform support, load run arguments, start Packager, run app in all connected devices                                                                                    |
| Run iOS on Simulator             | Run an iOS application on Simulator. Launch order: load run arguments, check target platform support, start Packager, run app in only one connected emulator                                                                               |
| Run iOS on Device                | Run an iOS application on Device. Launch order: load run arguments, check target platform support, start Packager, run app in only one connected device                                                                                    |
| Run Expo                         | Run an Exponent application. Launch order: login to exponent, load run arguments, start Packager, run app                                                                                                                                  |
| Run Windows                      | Run a RNW application. Launch order: check target platform support, load run arguments, start Packager, run app                                                                                                                            |
| Run MacOS                        | Run a RNmacOS application. Launch order: check target platform support, load run arguments, start Packager, run app                                                                                                                        |
| Start Packager                   | Start Packager in context project workspace folder                                                                                                                                                                                         |
| Stop Packager                    | Stop Packager                                                                                                                                                                                                                              |
| Restart Packager                 | Restart Packager                                                                                                                                                                                                                           |
| Publish To Expo                  | Publish to Exponent Host. Launch order: login to exponent, execute `Run Expo` command, then publish app to host                                                                                                                            |
| Show Dev Menu                    | Show development menu for running aplication on iOS or Android device or emulator                                                                                                                                                          |
| ReloadApp                        | Reload an application                                                                                                                                                                                                                      |
| Run Element Inspector            | Load development tools for inspect application UI elements                                                                                                                                                                                 |
| Run React Native LogCat Monitor  | Creates a LogCat Monitor for the chosen online Android device to see the device LogCat logs. Default filtering arguments: ["*:S", "ReactNative:V", "ReactNativeJS:V"]. [How to configure filtering.](#configure-an-Android-LogCat-Monitor) |
| Stop React Native LogCat Monitor | Stops an existing LogCat Monitor and removes its output channel                                                                                                                                                                            |
| Run Network Inspector            | Run [Network inspector](#network-inspector)                                                                                                                                                                                                |
| Stop Network Inspector           | Stop [Network inspector](#network-inspector)                                                                                                                                                                                               |

# Debugging React Native applications

To start debugging create a new debug configuration for your ReactNative app in your `.vscode/launch.json`. Adding a new configuration can be done by opening your `launch.json` file and clicking on `Add Configuration...` button and choosing a relevant debug configuration. All available debug configurations for ReactNative can be accessed by typing in _ReactNative_ and picking one from the list populated by Intellisense as shown in the image below.

![Add React Native debug configuration](images/add-debug-configuration.gif)

In case you haven't created the `.vscode/launch.json` file yet, you can add a whole default debug configuration set. To do that click the debug icon ![Choose React Native debugger](images/debug-view-icon.png) in the View bar, and then click the configuration (gear) icon ![Configure-gear](images/configure-gear-icon.png), then choose the React Native debug environment.

![Choose React Native debugger](images/choose-debugger.png)

VS Code will generate a `launch.json` in your project with some default configuration settings as shown below. You can safely close this file, choose the appropriate configuration in the Configuration dropdown, and then press F5 (or click _Green Arrow_ ![Configure-gear](images/debug-icon.png) button) to start debugging your app in VS Code.

![React Native launch targets](images/debug-targets.png)

Once app is loaded and running, [open the developer menu](https://reactnative.dev/docs/debugging#accessing-the-in-app-developer-menu) inside your application and enable remote debugging by clicking on `Debug JS Remotely` button.

![React Native enable remote debug](images/enable-remote-debug.png)

The extension allows you to debug multiple devices and configurations, please read the following sections for more information for your particular use case.

## Hermes engine

The Hermes engine is an open source JavaScript engine created by Facebook to optimize building and running React Native applications. It improves app performance and decreases app size.

Click [here](https://reactnative.dev/docs/hermes) to learn more about Hermes and how to enable it for your application.

Debugging apps with Hermes enabled is currently experimental. Please, see [this issue](https://github.com/microsoft/vscode-react-native/issues/1073) for current known issues on Hermes support.

### Android Hermes

To debug while using Hermes engine use `Debug Android Hermes - Experimental` launch configuration:

```json
{
  "name": "Debug Android Hermes - Experimental",
  "cwd": "${workspaceFolder}",
  "type": "reactnativedirect",
  "request": "launch",
  "platform": "android"
}
```

### iOS Hermes

The extension provides experimental support of debugging iOS Hermes applications. See [iOS Hermes debugging](#ios-hermes-debugging) for more details.

### macOS Hermes

The extension provides experimental support of debugging macOS Hermes applications. See [macOS Hermes debugging](#macos-hermes-debugging) for more details.

### Attach to Hermes application

To attach to a running Hermes application use `Attach to Hermes application - Experimental` launch configuration:

```json
{
  "name": "Attach to Hermes application - Experimental",
  "cwd": "${workspaceFolder}",
  "type": "reactnativedirect",
  "request": "attach"
}
```

## iOS applications

### iOS devices

Debugging on an iOS device requires following manual steps:

- Install [ios-deploy](https://www.npmjs.com/package/ios-deploy) `npm install -g ios-deploy`.
- Install a valid iOS development certificate.
- In your project's `launch.json` file set `target` to `device`. If you need to specify the exact device to run, you can set `target` to `device=<iOS_device_name>`, or you can also use `runArguments` property to specify a particular device to run on in case multiple devices are connected (e.g. `"runArguments": [ "--device", "My iPhone" ]`)
- Choose the **Debug iOS** option from the "Configuration" dropdown and press F5.
- Shake the device to open the development menu and select "Debug JS Remotely".

### Custom scheme for iOS apps

If you want to use a custom scheme for your application you can either pass it as part of the `runArguments` parameter arguments, or set the `scheme` configuration parameter as shown below:

```js
"runArguments": ["--scheme", "customScheme", ...]
// or
"runArguments": ["--scheme=customScheme", ...]
// or
"scheme" : "customScheme"
```

Please be aware, specifying the scheme value as a part of the `runArguments` parameter arguments will override the `scheme` configuration parameter value, if it set.

### iOS direct debugging

The extension provides experimental support of iOS direct debugging. See more info here: [react-native-community/discussions-and-proposals#40](https://github.com/react-native-community/discussions-and-proposals/issues/40), [react-native-community/discussions-and-proposals#206](https://github.com/react-native-community/discussions-and-proposals/issues/206)

For now the extension supports iOS direct debugging only on real iOS devices.

To be able to debug an iOS app directly, you need to install [ios-webkit-debug-proxy](https://github.com/google/ios-webkit-debug-proxy):

- Install [HomeBrew](https://brew.sh) on your Mac.
- Open a Terminal and run `brew install ideviceinstaller ios-webkit-debug-proxy`

You can use the following debug scenarios to debug iOS apps directly:

- React Native Direct: Debug Direct iOS - Experimental

```json
    "name": "Debug Direct iOS - Experimental",
    "cwd": "${workspaceFolder}",
    "type": "reactnativedirect",
    "request": "launch",
    "platform": "ios",
    "port": 9221,
    "target": "device"
```

- React Native Direct: Attach to the React Native iOS - Experimental

```json
    "name": "Attach to the React Native iOS - Experimental",
    "cwd": "${workspaceFolder}",
    "type": "reactnativedirect",
    "request": "attach",
    "platform": "ios",
    "port": 9221
```

### iOS Hermes debugging

You can enable Hermes engine for an iOS application by editing `ios/Podfile` file the following way:

```diff
-  use_react_native!(:path => config[:reactNativePath])
+  use_react_native!(:path => config[:reactNativePath], :hermes_enabled => true)
```

After this change you need to execute `pod install` command in `ios` folder. After that you can use `Debug iOS Hermes - Experimental` launch configuration to debug an iOS Hermes application:

```json
{
  "name": "Debug iOS Hermes - Experimental",
  "cwd": "${workspaceFolder}",
  "type": "reactnativedirect",
  "request": "launch",
  "platform": "ios"
}
```

## Expo applications

To debug a project created using Expo or the `create-react-native-app` task, you can use embedded support for Expo.

Prepare your environment by following the [Expo CLI Quickstart instruction](https://reactnative.dev/docs/environment-setup).
For correct work with Expo this extension **`requires Android SDK`**.
So also pay attention to the `React Native CLI Quickstart` tab, where you can find the Android SDK installation guide:

- Install the [Expo app](https://getexponent.com/) on the target device or emulator
- Ensure that the `Android SDK` is installed on your computer (You may install it using the [`React Native CLI Quickstart` guide](https://reactnative.dev/docs/environment-setup))
- Ensure that the `expo-cli` is installed globally (`npm install -g expo-cli`)

You can verify that everything is working correctly and that the environment is ready for use with the `npx react-native doctor` command.

To start debugging in Expo follow these steps:

1. Open your project in VS Code with this extension installed.
1. Create a debug configuration (as described in [Debugging React Native applications](#debugging-react-native-applications)), select `Debug in Exponent` in the debug drop-down menu, and start debugging
1. Wait while some dependencies are configured - the extension will install [`Expo Development Library(xdl)`](https://www.npmjs.com/package/xdl) when this feature is used for the first time.
1. If you have not used Exponent on this system before, you will be prompted for an Exponent username and password.
   Exponent account allows you to use Expo cloud services. More info about how it works is available [here](https://docs.expo.io/versions/latest/workflow/how-expo-works/).
   If you have not created an Exponent account, then specifying a new username and password will create one.
   Note that there is no e-mail associated with the account, and no way to recover a forgotten password.
   If you don't want to create an Exponent account, you can specify `expoHostType` parameter in your debug configuration to make Expo work locally (via LAN or on localhost).
1. Once the packager starts, the extension will open a separate tab with QR code to scan from the Exponent app. Once you do so, the Exponent app will connect to the packager and begin running your app.
1. Once the app is loaded and running, [open the developer menu](https://reactnative.dev/docs/debugging#accessing-the-in-app-developer-menu) and enable remote debugging by clicking on `Debug JS Remotely` button.

   ![React Native developer menu](./images/enable-remote-debug.png)

   From here you can run and debug the app as normal.

### Configuring Expo

The extension supports running through Exponent not just the applications created with Expo but even pure React Native applications (in that case you need to add `expo` package to `node_modules` in order to make it work with Expo: `npm install expo --save-dev`. In either cases it uses `app.json` configuration file in the root of the project.

If you are running `Debug in Exponent` configuration or any of pallette commands like `Run in Exponent`, `Publish to Exponent` then this file will be created automatically if absent or updated with the following basic configuration section:

```json
{
  "expo": {
    "slug": "MyApp", // Project slug
    "name": "MyApp", // Project name
    "sdkVersion": "31.0.0", // Expo SDK version
    "entryPoint": ".vscode\\exponentIndex.js" // Entrypoint for the project
  },
  "name": "MyApp" // Project name
}
```

Full list of configuration parameters for `expo` section in `app.json` may be found on [official Expo documentation page](https://docs.expo.io/versions/latest/workflow/configuration).

For running **pure React Native app**, the extension, creates and uses `.vscode/exponentIndex.js` which points to the app entrypoint (`index.js` or `index.android.js` or `index.ios.js`) file.

If you want to change your app entrypoint (for example, from `index.js` to `index.android.js`), delete `.vscode/exponentIndex.js` and then restart your debugging session.

**NOTE**: The extension caches the version of the exponent SDK used by your project. This is helpful since we don't want to install the SDK each time you run exponent. If you want the extension to update the SDK version based on your React Native version, just restart VS Code and if it is supported it should work. If it does not please open an issue.

## React Native for Windows

### How to launch and debug a React Native for Windows application

Before launching and debugging a React Native for Windows application, please make sure that your development environment is configured properly in accordance with [the official system requirements](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies).

You can debug UWP React Native for Windows applications by changing the `platform` in your `launch.json` configuration to `windows`:

```json
{
  "name": "Debug Windows",
  "cwd": "${workspaceFolder}",
  "type": "reactnative",
  "request": "launch",
  "platform": "windows"
}
```

### How to attach to a running React Native for Windows application

1. Add the `Attach to packager` configuration to `.vscode/launch.json` in your project

   ```json
   {
     "name": "Attach to packager",
     "cwd": "${workspaceFolder}",
     "type": "reactnative",
     "request": "attach"
   }
   ```

1. (**Optional**) Start Metro packager by means of the `React Native: Start Packager` Command Palette command or run `npx react-native start` command in the terminal in the project root folder
1. Select the `Attach to packager` configuration and click the `play` button. If Metro packager isn't running yet, the extensnion will start it automatically.
1. Launch your React Native Windows application. Please make sure that the application is on remote debugging mode.

Then the extension should attach to the running application.

You can find more information on how to setup your application to work with Windows in [React Native for Windows Getting started instruction](https://microsoft.github.io/react-native-windows/docs/getting-started)

## React Native for macOS

You can debug React Native for macOS applications by changing the `platform` in your `launch.json` configuration to `macos`:

```json
{
  "name": "Debug macOS",
  "cwd": "${workspaceFolder}",
  "type": "reactnative",
  "request": "launch",
  "platform": "macos"
}
```

To attach to a running macOS application you can use the default `Attach to packager` debugging configuration. Please make sure that the application is on remote debugging mode.

```json
{
  "name": "Attach to packager",
  "cwd": "${workspaceFolder}",
  "type": "reactnative",
  "request": "attach"
}
```

You can find more information on how to setup your application to work with macOS in [React Native for macOS Getting started instruction](https://microsoft.github.io/react-native-windows/docs/rnm-getting-started)

### macOS Hermes debugging

Please follow [the official guide](https://microsoft.github.io/react-native-windows/docs/hermes#available-on-macos) to enable Hermes engine for a macOS application.

To debug a macOS Hermes application you can use `Debug macOS Hermes - Experimental` debugging scenario:

```json
{
  "name": "Debug macOS Hermes - Experimental",
  "request": "launch",
  "type": "reactnativedirect",
  "cwd": "${workspaceFolder}",
  "platform": "macos"
}
```

## TypeScript and Haul

### Sourcemaps

The debugger uses sourcemaps to let you debug with your original sources, but sometimes the sourcemaps aren't generated properly and overrides are needed. In the config we support `sourceMapPathOverrides`, a mapping of source paths from the sourcemap, to the locations of these sources on disk. Useful when the sourcemap isn't accurate or can't be fixed in the build process.

The left hand side of the mapping is a pattern that can contain a wildcard, and will be tested against the `sourceRoot` + `sources` entry in the source map. If it matches, the source file will be resolved to the path on the right hand side, which should be an absolute path to the source file on disk.

Below there are some examples of how sourcemaps could be resolved in different scenarios:

```javascript
// webRoot = /Users/me/project
"sourceMapPathOverrides": {
    "webpack:///./~/*": "${webRoot}/node_modules/*",       // Example: "webpack:///./~/querystring/index.js" -> "/Users/me/project/node_modules/querystring/index.js"
    "webpack:///./*":   "${webRoot}/*",                    // Example: "webpack:///./src/app.js" -> "/Users/me/project/src/app.js",
    "webpack:///*":     "*",                               // Example: "webpack:///project/app.ts" -> "/project/app.ts"
    "webpack:///src/*": "${webRoot}/*"                     // Example: "webpack:///src/app.js" -> "/Users/me/project/app.js"
}
```

### Haul debugging

The extension provides functional to attach to [Haul packager](https://callstack.github.io/haul/) based applications. You can use the `Attach to packager` scenario to attach to a Haul based app and debug it. For now launch scenarios aren't supported. You can find more info in [the issue](https://github.com/microsoft/vscode-react-native/issues/883).

You can prepare your React Native application to work with `Haul` by following the [`Haul Getting started` guide](https://github.com/callstack/haul#getting-started).

If you use the [legacy version](https://github.com/callstack/haul/tree/legacy) of `Haul` as your React Native bundler instead of the default [Metro](https://facebook.github.io/metro/), it could be required to add `sourceMapPathOverrides` to the `launch.json` file.

For example:

```json
{
  // Other configurations
  "sourceMapPathOverrides": {
    "webpack:///./~/*": "${workspaceRoot}/node_modules/*",
    "webpack:///./*": "${workspaceRoot}/*",
    "webpack:///*": "*"
  }
}
```

## Debugger configuration properties

The following is a list of all the configuration properties the debugger accepts in `launch.json`:

| Name                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Type       | Defaults                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------- |
| `cwd`                              | The path to the project root folder                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `string`   | `${workspaceFolder}`                          |
| `sourceMaps`                       | Whether to use JavaScript source maps to map the generated bundled code back to its original sources                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `boolean`  | `true`                                        |
| `sourceMapPathOverrides`           | A set of mappings for rewriting the locations of source files from what the source map says, to their locations on disk. See [Sourcemaps](#sourcemaps) for details                                                                                                                                                                                                                                                                                                                                                                                                                                           | `object`   | n/a                                           |
| `sourceMapRenames`                 | Whether to use the "names" mapping in sourcemaps. This requires requesting source content, which could slow debugging                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `boolean`  | `false`                                       |
| `enableDebug`                      | Whether to enable debug mode. If set to "false", an application will be launched without debugging                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `boolean`  | `true`                                        |
| `webkitRangeMin`, `webkitRangeMax` | Combines to specify the port range that you want the [ios-webkit-debug-proxy](https://github.com/google/ios-webkit-debug-proxy) to use to find the specific device described in the Direct iOS debug configuration                                                                                                                                                                                                                                                                                                                                                                                           | 9223, 9322 |
| `trace`                            | Logging level in debugger process. May be useful for diagnostics. If set to "Trace" all debugger process logs will be available in `Debug Console` output window                                                                                                                                                                                                                                                                                                                                                                                                                                             | `string`   | `log`                                         |
| `address`                          | TCP/IP address of packager to attach to for debugging                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `string`   | `localhost`                                   |
| `port`                             | Port of packager to attach to for debugging                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `string`   | `8081`                                        |
| `remoteRoot`                       | The source root of the remote host                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `string`   | `null`                                        |
| `localRoot`                        | The local source root that corresponds to the 'remoteRoot'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `string`   | `${workspaceFolder}`                          |
| `skipFiles`                        | An array of file or folder names, or glob patterns, to skip when debugging                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `array`    | `[]`                                          |
| `debuggerWorkerUrlPath`            | Path to the app debugger worker to override. For example, if debugger tries to attach to http://localhost:8081/debugger-ui/debuggerWorker.js and you get 404 error from packager output then you may want to change debuggerWorkerUrlPath to another value suitable for your packager (\"debugger-ui\" will be replaced with the value you provide)                                                                                                                                                                                                                                                          | `string`   | `debugger-ui/`                                |
| `platform`                         | The platform to target. Possible values: `android`, `ios`, `exponent`, `windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `string`   | n/a                                           |
| `target`                           | Target to run on. Possible values: `simulator`, `device`, `device=<iOS device name>`, [`<Android emulator/device id>`](https://github.com/react-native-community/cli/blob/master/docs/commands.md#--deviceid-string), `<Android emulator name>`, `<iOS simulator name>`, `<iOS simulator id>`. If the value is `simulator` then the quick pick window will be expanded with the names of the available virtual devices, then the target value in `launch.json` will be changed to the name of the selected virtual device. If you have only one virtual device available, it will be selected automatically. | `string`   | `simulator`                                   |
| `logCatArguments`                  | Arguments to be used for LogCat (The LogCat output will appear on an Output Channel). It can be an array such as: `[":S", "ReactNative:V", "ReactNativeJS:V"]`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `array`    | `["*:S", "ReactNative:V", "ReactNativeJS:V"]` |
| `runArguments`                     | Run arguments to be passed to `react-native run-<platform>` command (override all other configuration params)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `array`    | n/a                                           |
| `launchActivity`                   | The Android activity to be launched for debugging, e.g. it specifies [`--main-activity`](https://github.com/react-native-community/cli/blob/master/docs/commands.md#--main-activity-string) parameter in `react-native` run arguments                                                                                                                                                                                                                                                                                                                                                                        | `string`   | `MainActivity`                                |
| `expoHostType`                     | The connection type to be used on Expo debugging to communicate with a device or an emulator. Possible values: <ul><li>`tunnel` - allows to deploy and debug an application by means of Expo cloud services</li><li>`lan` - allows to deploy and install an application via your LAN</li><li>`local` - allows to debug an application on an emulator or an Android device without network connection</li></ul>                                                                                                                                                                                               | `string`   | `lan`                                         |
| `env`                              | Environment variables passed to the debugger and `react-native run-<platform>` command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `object`   | `{}`                                          |
| `envFile`                          | Absolute path to a file containing environment variable definitions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `string`   | `${workspaceFolder}/.env`                     |
| `variant`                          | A variant to be passed to `react-native run-android`, e.g. use `devDebug` to specify `--variant=devDebug`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `string`   | n/a                                           |
| `scheme`                           | A scheme name to be passed to `react-native run-ios`, e.g. `devDebug` to specify `--scheme=devDebug`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `string`   | n/a                                           |
| `productName`                      | iOS bundle display name e.g. `AwesomeProject` value means that the extension will search for `AwesomeProject.app` bundle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `string`   | n/a                                           |

# Customization

The extension can be further customized for other React Native scenarios. These are the most common:

## Logging

The extension logging is divided by several output channels:

- React Native - the main extension channel which collects outputs from React Native Packager and shows critical errors in the extension
- These channels are spawned only when the specific launch scenario is executed:
  - React Native: Run Android
    - LogCat monitor(to get LogCat output from Android device, can be filtered by debug configuration settings)
  - React Native: Run iOS
  - React Native: Run macOS
  - React Native: Run exponent
- Debug Console which is used to receive application logs and logs generated by the debug adapter (`console.log` and other `std` outputs from the app)
- Extension debugger verbose logs (these logs are shown up only if the `trace: "verbose"` option is enabled in debug scenarios)
  - React Native Chrome Proxy - shows what runs in and out to the debugger and application
  - Debug Console becomes more informative and contains some debugging information from the debug adapter
  - Global extension errors are controlled by VS Code and printed in VS Code Developer Tools

There are also some global extension technical logs that might be exposed to the output. To see them set the following properties:

```json
{
  "react-native-tools": {
    "logLevel": "Trace"
  }
}
```

`logLevel` can be `None` (no logs), `Error`, `Warning`, `Info`, `Debug`, `Trace` (all logs). Default is `Info`.

## Build APK and generate bundle

You can add VSCode tasks to build an `.apk` file and generate iOS/Android bundles.

The following is an example of a `tasks.json` for `react-native init` projects.
Place it in the `.vscode` folder in your project to use it:

```json
{
  "version": "2.0.0",
  "presentation": {
    "reveal": "always",
    "panel": "new"
  },
  "tasks": [
    {
      "taskName": "Build APK Debug",
      "group": "build",
      "type": "shell",
      "windows": {
        "command": "cd android; if($?) {./gradlew assembleDebug}"
      },
      "linux": {
        "command": "cd android && ./gradlew assembleDebug"
      }
    },
    {
      "taskName": "Build APK Release",
      "group": "build",
      "type": "shell",
      "windows": {
        "command": "cd android; if($?) {./gradlew assembleRelease}"
      },
      "linux": {
        "command": "cd android && ./gradlew assembleRelease"
      }
    },
    {
      "taskName": "Generate Android Bundle",
      "group": "build",
      "type": "shell",
      "command": "react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/main.jsbundle"
    },
    {
      "taskName": "Generate iOS Bundle",
      "group": "build",
      "type": "shell",
      "command": "react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle"
    }
  ]
}
```

To learn more about `tasks` in VSCode read [the official documentation](https://code.visualstudio.com/docs/editor/tasks).

Visit [generating Signed APK](https://reactnative.dev/docs/signed-apk-android.html) to learn more about this subject.

## Specifying custom arguments for `react-native run-*` command

Using custom run arguments for `react-native run-<platform>`:
**NOTE:** This overrides all other configuration parameters.

```json
{
  "react-native.android.runArguments.simulator": [
    "--appFolder",
    "/Users/test/AwesomeProject/android/app",
    "--deviceId",
    "emulator-5555"
  ],
  "react-native.ios.runArguments.device": [
    "--project-path",
    "ios",
    "--device",
    "Max's iPhone"
  ]
}
```

**NOTE:** You can get the list of installed simulator devices by:

iOS devices (macOS only):

```
xcrun simctl list --json devices
```

Android devices:

```
adb devices
```

**NOTE:** If you want to run the application on an iOS device, make sure you have `ios-deploy` installed globally.

`npm install -g ios-deploy`

## Setting up the React Native packager

To use a custom port for the `react-native` packager:

```json
{
  "react-native": {
    "packager": {
      "port": portNumber
    }
  }
}
```

If you change this port, then for iOS device and simulator scenarios you will have to modify the native code files. [Instructions here](https://blog.binoy.io/running-react-native-on-a-different-port-7deb43887cd4).

If you use Android, you need to change the debug server by:

1. `CTRL+M`(`CMD+M`) in the emulator
2. Go to `Dev Settings`
3. Debug server host for device => enter `localhost:<yourPortNumber>`.
4. Reload application (press `R` twice)
5. (Hermes only) Hermes engine listens port 8081 for debugging by default, to change it you might need to modify your [`metro.config.js` file adding `"port": portNumber` argument in there to the server settings](https://facebook.github.io/metro/docs/configuration/#port).

```js
// Example of metro.config.js
module.exports = {
  server: {
    port: 9091,
  },
};
```

<details>
<summary>Port setup instruction</summary>

![image](images/select-dev-menu.png)

![image](images/dev-menu-setup-custom-host.png)

![image](images/custom-host-and-port.png)

</details>

**NOTE:** Some aspects of React Native hard-code the port to the default as specified in [this issue](https://github.com/facebook/react-native/issues/9145).

### Custom environment variables

Extension supports passing custom environment variables to the React Native Packager process context. To add custom variables you can create `.env` file in the root folder of your project and add needed environment variables in the following format:

```

Variable1_name=Variable1_value
Variable2_name=Variable2_value

```

Variables that are declared in this `.env` file can override the original environment variables from `process.env` of the Packager process.

It is possible to transfer environment variables (via `env` and `envFile` arguments in `launch.json`) from the `launch` or `attach` debug scenarios to the Packager. If these variables are defined, then they will be used, otherwise the `.env` file is used.

## Change project root

To specify a subfolder in which the react-native project is located, set `react-native-tools.projectRoot`. You can use either an absolute or relative path here:

```json
{
  "react-native-tools": {
    "projectRoot": "./your/react-native/project"
  }
}
```

## Configure an Android LogCat Monitor

There are two ways to filter your LogCat Monitor output depending on how LogCat Monitor was launched:

1. Since LogCat Monitor is launched for all Android launch scenarios by default, you can add `logCatArguments` to your debug scenario in `launch.json` file like in the following example:

```json
{
  "name": "Debug Android",
  "cwd": "${workspaceFolder}",
  "type": "reactnative",
  "request": "launch",
  "platform": "android",
  "logCatArguments": ["ReactNativeJS:V"]
}
```

2. If you want to launch LogCat Monitor from the Command Pallette command `React Native: Run React Native LogCat Monitor` with filtering options set `react-native.android.logCatArguments` settings in your `settings.json`:

```json
{
  "react-native.android.logCatArguments": [
    "*:S",
    "ReactNative:V",
    "ReactNativeJS:V"
  ]
}
```

To have better understanding on how LogCat filtering works take into account that the extension launches LogCat with flag `-s` and then adds user-provided filters as arguments. Please see the [official instruction on how does LogCat filtering works](https://developer.android.com/studio/command-line/logcat#filteringOutput).

## Configure dependencies versions for debugging Expo projects

To debug Expo applications the extension requires additional dependencies, such as `xdl` and `@expo/metro-config`. These packages are installed automatically on the first start of the Expo debugging scenario. You can configure the dependencies versions by setting the `react-native.expo.dependencies.<package name>` parameter in `settings.json`:

```json
{
  "react-native.expo.dependencies.xdl": "59.0.42",
  "react-native.expo.dependencies.metroConfig": "0.1.72"
}
```

To enable new versions of the dependencies, it's required to restart VS Code editor. After that the extension will download the new versions of the packages on the next Expo debugging starting.

## Configure custom key bindings for extension commands

The extension provides context variables for the following features:
|Context variable|Feature|
|---|---|
|`isRNPackagerRunning` - true if the packager is running|Metro packager|
|`isRNTNetworkInspectorRunning` - true if the Network inspector is running|Network inspector|

Using these context variables you can assign the same keyboard combination for some pair commands for more convenient use. For example, you can configure the same key bindings for `Start Packager` and `Stop Packager` commands using `when` clauses, as shown below:
![image](images/custom-keybindings.png)

# Network Inspector

The extension provides `Network inspector` feature to inspect outgoing network traffic in your apps. You can browse all requests being made and their responses in VS Code DevTools console.

![image](images/network-inspector.png)

### Network inspector requirements

Before using the Network inspector, please make sure that your system meets the following requirements:

- `OpenSSL` utility is installed and added to PATH. You can install `OpenSSL` the following way:
  - Windows: `choco install openssl`
  - macOS: `brew install openssl`
  - Linux: `sudo apt-get install openssl`
- (macOS only) [`idb`](https://fbidb.io/docs/installation/) utility is installed. It's required to interact with iOS physical devices

### Network inspector usage

- To run the Network inspector you can use `Run Network Inspector` Command Palette command</br>
  When the Network inspector detects a React Native application and connects to it, VS Code DevTools window will be opened automatically. But you can also open it manually, by opening `Help` menu and clicking `Toggle Developer Tools` option. After that you just need to open `Console` tab in DevTools, where network requests will be printed.
- To stop the Network inspector you can use `Stop Network Inspector` Command Palette command

For now the Network inspector doesn't support Expo applications.

### Network inspector logs theme

The extension provides “Dark” and “Light” color themes for Network Inspector logs. You can configure the theme in the extension configuration in the Settings tab or in `settings.json` file.

```json
{
  "react-native-tools.networkInspector.consoleLogsColorTheme": "Dark"
}
```

# Developing inside a Docker Container

The extension supports [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview) features on Linux. Please follow the [VS Code official documentation](https://code.visualstudio.com/docs/remote/containers) to setup your environment to use a remote development approach.

You can use [official React Native Docker image](https://hub.docker.com/r/reactnativecommunity/react-native-android) provided by the [react-native-community](https://github.com/react-native-community/docker-android).

Here are the steps to run React Native debugging inside a Docker Container on a real Android device:

1. Open Command Palette and run the following command
   ```
   Remote-Containers: Add Development Container Configuration Files...
   ```
   Then select `Existing Dockerfile` to create `.devcontainer/devcontainer.json` configuration file.
1. Сreate Dockerfile extending [reactnativecommunity/react-native-android image](https://hub.docker.com/r/reactnativecommunity/react-native-android). For example you can use the following Dockerfile:

   ```
   FROM reactnativecommunity/react-native-android:latest

   RUN npm install -g expo-cli react-native-cli
   ```

1. Configure your `devcontainer.json` file as needed. Below is a sample configuration:

   ```json
   {
     "name": "React Native Android Container",

     // Sets the run context to one level up instead of the .devcontainer folder.
     "context": "..",

     // Update the 'dockerFile' property if you aren't using the standard 'Dockerfile' filename.
     "dockerFile": "Dockerfile",

     // The optional 'runArgs' property can be used to specify additional runtime arguments.
     "runArgs": [
       "--privileged", // give all capabilities to a container, in other words, the container can then do almost everything that the host can do
       "--net",
       "host", // forwarding all host machine ports
       "-v",
       "/dev/bus/usb:/dev/bus/usb" // mount connected USB devices to a container
     ],

     "settings": {
       // This will ignore your local shell user setting for Linux since shells like zsh are typically
       // not in base container images. You can also update this to an specific shell to ensure VS Code
       // uses the right one for terminals and tasks. For example, /bin/bash (or /bin/ash for Alpine).
       "terminal.integrated.shell.linux": null
     },

     // Add the IDs of extensions you want installed when the container is created in the array below.
     "extensions": ["msjsdiag.vscode-react-native"]
   }
   ```

1. Open Command Palette and run the following command `Remote-Containers: Open Folder in Container` to reopen your project in a container
1. Connect your device via USB and start debugging the same way as on local machine.

Currently the above scenario doesn't work on macOS and Windows. Docker Container implementation on these OS uses Virtual Machine tools which may have problems with USB forwarding for mobile devices.

# Contributing

Please see our [contributing guide](CONTRIBUTING.md) for more information.

# Known Issues

Here is the list of common known issues you may experience while using the extension:

| Issue                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Debugger doesn't stop at breakpoints                                                                       | Breakpoints require sourcemaps to be correctly configured. If you are using TypeScript, then make sure to follow the `Getting started` section for how to ensure sourcemaps are correctly set up. Also, similar issues may occur on React Native version `0.58.*` in some special cases (see [#928](https://github.com/microsoft/vscode-react-native/issues/928), [#907](https://github.com/microsoft/vscode-react-native/issues/907)), bumping dependencies versions of `react` and `react-native` package to the more recent ones should resolve these. If you are on Linux, make sure that the project folder which is opened is not a symbolic link to the real folder, that might cause problems with sourcemaps (see [#1456](https://github.com/microsoft/vscode-react-native/issues/1456)) |
| 'adb: command not found'                                                                                   | If you receive an error `adb: command not found`, you need to update your system Path to include the location of your _ADB_ executable.The _ADB_ executable file is located in a subdirectory along with your other Android SDK files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Targeting iPhone 6 doesn't work                                                                            | There was a known issue with React Native ([#5850](https://github.com/facebook/react-native/issues/5850)) but it was fixed. Please upgrade your version of React Native.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Can't communicate with socket pipe                                                                         | (Linux only) If you have two workspaces open that only differ in casing, the extension will fail to communicate effectively.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| "Add configuration" button doesn't work when trying to add debug configuration to `launch.json`            | You have to add some json configuration to `launch.json` manually. Please, see ([#985](https://github.com/microsoft/vscode-react-native/issues/985)).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Error `None of these files exist: * .vscode/exponentIndex` appears when running React Native apps via Expo | On some project configurations (mostly on macOS) there could be problems with running RN app via Expo for the first time. You can resolve this by explicitly adding `module.exports.watchFolders = ['.vscode'];` to your Metro config. This will help Metro bundler to find the custom entry point generated by the extension needed to work with Expo. For details you can see the issue ([#1327](https://github.com/microsoft/vscode-react-native/issues/1327)).                                                                                                                                                                                                                                                                                                                                |
| High CPU load notification while starting debugging Expo app                                               | When you start debugging the Expo application you may receive the notification `"The extension 'React Native Tools' took a very long time to complete its last operation and it has prevented other extensions from running"`. The issue occurs because of importing the `xdl` package, which extension uses for debugging Expo applications. The `xdl` package has the large size and some peculiarities of its structure, so it may cause high CPU load.                                                                                                                                                                                                                                                                                                                                        |

[Known-Issues](https://github.com/microsoft/vscode-react-native/issues?q=is%3Aissue+label%3Aknown-issues) provides a complete list of active and resolved issues.

# Telemetry reporting

VS Code React Native extension collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://www.visualstudio.com/en-us/dn948229) to learn more.

If you don’t wish to send usage data to Microsoft, edit `VSCodeTelemetrySettings.json` file at `~/.vscode-react-native` and add `optIn:false`.

# Code of conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
