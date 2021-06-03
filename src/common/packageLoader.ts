// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import { OutputChannelLogger } from "../extension/log/OutputChannelLogger";
import { CommandExecutor, CommandVerbosity } from "./commandExecutor";
import customRequire from "./customRequire";
import { findFileInFolderHierarchy, getVersionFromExtensionNodeModules } from "./extensionHelper";
import { HostPlatform } from "./hostPlatform";
import * as path from "path";
import { AppLauncher } from "../extension/appLauncher";
import { PromiseUtil } from "./node/promise";

const WRONG_VERSION_ERROR =
    "The installed version of the package is different from the required one";

export interface PackageConfig {
    packageName: string;
    requirePath?: string;
    version?: string;
}

export default class PackageLoader {
    private logger: OutputChannelLogger;
    private packagesQueue: string[];
    private requireQueue: ((load?: string[]) => Promise<boolean>)[];
    private isCommandsExecuting: boolean;

    private static instance: PackageLoader;

    private constructor() {
        this.logger = OutputChannelLogger.getMainChannel();
        this.packagesQueue = [];
        this.requireQueue = [];
        this.isCommandsExecuting = false;
    }

    public static getInstance(): PackageLoader {
        if (!this.instance) {
            this.instance = new PackageLoader();
        }
        return this.instance;
    }

    public installGlobalPackage(packageName: string, projectRoot: string): Promise<void> {
        const nodeModulesRoot: string = AppLauncher.getNodeModulesRootByProjectPath(projectRoot);
        const commandExecutor = new CommandExecutor(nodeModulesRoot, projectRoot, this.logger);

        return commandExecutor.spawnWithProgress(
            HostPlatform.getNpmCliCommand("npm"),
            ["install", "-g", packageName, "--verbose"],
            {
                verbosity: CommandVerbosity.PROGRESS,
            },
        );
    }

    public generateGetPackageFunction<T>(
        packageConfig: PackageConfig,
        ...additionalDependencies: PackageConfig[]
    ): () => Promise<T> {
        return PromiseUtil.promiseCacheDecorator<T>(() =>
            this.loadPackage<T>(packageConfig, ...additionalDependencies),
        );
    }

    private getUniquePackages(packages: string[]): string[] {
        return [...new Set(packages).values()];
    }

    private getTryToRequireFunction<T>(
        packageConfig: PackageConfig,
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void,
    ): (load?: string[]) => Promise<boolean> {
        return (load?: string[]) => {
            let itWasInstalled = false;
            const packageWithVersion =
                packageConfig.packageName +
                (packageConfig.version ? `@${packageConfig.version}` : "");
            // Throw exception if we could not find package after installing
            if (load && load.includes(packageWithVersion)) {
                itWasInstalled = true;
            }
            return this.tryToRequire<T>(packageConfig, resolve, reject, itWasInstalled);
        };
    }

    private async tryToRequire<T>(
        packageConfig: PackageConfig,
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void,
        itWasInstalled: boolean,
    ): Promise<boolean> {
        const requiredPackage =
            packageConfig.packageName +
            (packageConfig.requirePath ? `/${packageConfig.requirePath}` : "");
        try {
            this.logger.debug(`Getting ${requiredPackage} dependency.`);
            console.log(
                `Try to require: ${requiredPackage} with version (${packageConfig.version})`,
            );
            if (packageConfig.version) {
                const installedVersion = await getVersionFromExtensionNodeModules(
                    packageConfig.packageName,
                );
                console.log(`Actual Version of ${requiredPackage} is (${installedVersion})`);
                if (packageConfig.version !== installedVersion) {
                    if (itWasInstalled) {
                        throw WRONG_VERSION_ERROR;
                    }
                    return false;
                }
            }
            const module = customRequire(requiredPackage);
            resolve(module);
            return true;
        } catch (e) {
            if (itWasInstalled || e.code !== "MODULE_NOT_FOUND") {
                reject(e);
                return true;
            }
            this.logger.debug(
                `Dependency ${requiredPackage} is not present. Retry after install...`,
            );
            return false;
        }
    }

    private async tryToRequireAfterInstall(
        tryToRequire: (load?: string[]) => Promise<boolean>,
        packageConfig: PackageConfig,
        ...additionalDependencies: PackageConfig[]
    ): Promise<void> {
        const packageWithVersion =
            packageConfig.packageName + (packageConfig.version ? `@${packageConfig.version}` : "");
        this.packagesQueue.push(packageWithVersion);
        additionalDependencies.forEach(dependency => {
            const dependencyWithVersion =
                dependency.packageName + (dependency.version ? `@${dependency.version}` : "");
            this.packagesQueue.push(dependencyWithVersion);
        });
        this.requireQueue.push(tryToRequire);
        if (!this.isCommandsExecuting) {
            this.isCommandsExecuting = true;

            const extensionDirectory: string = path.dirname(
                findFileInFolderHierarchy(__dirname, "package.json") || __dirname,
            );

            const commandExecutor = new CommandExecutor(
                path.join(extensionDirectory, "node_modules"),
                extensionDirectory,
                this.logger,
            );
            while (this.packagesQueue.length) {
                // Install all packages in queue
                this.packagesQueue = this.getUniquePackages(this.packagesQueue);

                console.log("this.requireQueue before");
                console.log(this.requireQueue);
                console.log("this.packagesQueue before");
                console.log(this.packagesQueue);

                const load = this.packagesQueue.length;
                const packagesForInstall = this.packagesQueue.slice(0, load);
                console.log("Packages for install:");
                console.log(packagesForInstall);
                await commandExecutor.spawnWithProgress(
                    HostPlatform.getNpmCliCommand("npm"),
                    ["install", ...packagesForInstall, "--verbose", "--no-save", "--global-style"],
                    {
                        verbosity: CommandVerbosity.PROGRESS,
                    },
                );
                // Try to require all pending packages after every 'npm install ...' command
                const requiresToRemove: ((load?: string[]) => Promise<boolean>)[] = [];
                for (tryToRequire of this.requireQueue) {
                    if (await tryToRequire(packagesForInstall)) {
                        requiresToRemove.push(tryToRequire);
                    }
                }
                // Remove resolved requires from queue
                requiresToRemove.forEach(tryToRequire => {
                    const index = this.requireQueue.indexOf(tryToRequire);
                    if (index > -1) {
                        this.requireQueue.splice(index, 1);
                    }
                });
                // If we resolved all requires, we should not install any other packages
                if (this.requireQueue.length) {
                    this.packagesQueue = this.getUniquePackages(this.packagesQueue);
                    packagesForInstall.forEach(module => {
                        const index = this.packagesQueue.findIndex(el => el === module);
                        if (index !== -1) {
                            this.packagesQueue.splice(index, 1);
                        }
                    });
                } else {
                    this.packagesQueue = [];
                }
                console.log("this.requireQueue after");
                console.log(this.requireQueue);
                console.log("this.packagesQueue after");
                console.log(this.packagesQueue);
            }
            this.isCommandsExecuting = false;
        }
    }

    private async loadPackage<T>(
        packageConfig: PackageConfig,
        ...additionalDependencies: PackageConfig[]
    ): Promise<T> {
        return new Promise(async (resolve: (value: T) => void, reject) => {
            const tryToRequire = this.getTryToRequireFunction(packageConfig, resolve, reject);
            if (!(await tryToRequire())) {
                this.tryToRequireAfterInstall(
                    tryToRequire,
                    packageConfig,
                    ...additionalDependencies,
                ).catch(reason => reject(reason));
            }
        });
    }
}
