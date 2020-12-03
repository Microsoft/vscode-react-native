// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as path from "path";
import * as fs from "fs";
import stripJsonComments = require("strip-json-comments");
import { stripJsonTrailingComma } from "../common/utils";

export interface IConfiguration {
    name: string;
    platform?: string;
    target?: string;
    type?: string;
    request?: string;
}
export interface ILaunchScenarios {
    configurations?: IConfiguration[];
}

export class LaunchScenariosManager {
    private pathToLaunchFile: string;
    private launchScenarios: ILaunchScenarios;

    constructor(rootPath: string) {
        this.pathToLaunchFile = path.resolve(rootPath, ".vscode", "launch.json");
    }

    public getLaunchScenarios(): ILaunchScenarios {
        return this.launchScenarios;
    }

    private getFirstScenarioIndexByParams(scenario: IConfiguration): number | null {
        if (this.launchScenarios.configurations) {
            for (let i = 0; i < this.launchScenarios.configurations.length; i++) {
                const config = this.launchScenarios.configurations[i];
                if (scenario.name === config.name &&
                    scenario.platform === config.platform &&
                    scenario.type === config.type &&
                    scenario.request === config.request) {
                        return i;
                    }
            }
        }
        return null;
    }

    private writeLaunchScenarios(launch: ILaunchScenarios = this.launchScenarios): void {
        if (fs.existsSync(this.pathToLaunchFile)) {
            fs.writeFileSync(this.pathToLaunchFile, JSON.stringify(launch, null, 4));
        }
    }

    public readLaunchScenarios(): void {
        if (fs.existsSync(this.pathToLaunchFile)) {
            const content = fs.readFileSync(this.pathToLaunchFile, "utf8");
            this.launchScenarios = JSON.parse(stripJsonTrailingComma(stripJsonComments(content)));
        }
    }

    public updateLaunchScenario(launchArgs: any, updates: any): void {
        this.readLaunchScenarios();
        let launchConfigIndex = this.getFirstScenarioIndexByParams(launchArgs);
        const launchScenarios = this.getLaunchScenarios();
        if (launchConfigIndex !== null && launchScenarios.configurations) {
            Object.assign(launchScenarios.configurations[launchConfigIndex], updates);
            this.writeLaunchScenarios(launchScenarios);
        }
    }
}