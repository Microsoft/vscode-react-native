// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import { Node } from "../../common/node/node";
import { ChildProcess } from "../../common/node/childProcess";

export class DefaultsHelper {
    private readonly DEV_MENU_SETTINGS = "RCTDevMenu";

    private nodeChildProcess: ChildProcess;

    constructor() {
        this.nodeChildProcess = new Node.ChildProcess();
    }

    public setPlistBooleanProperty(
        plistFile: string,
        property: string,
        value: boolean,
    ): Promise<void> {
        // Attempt to set the value, and if it fails due to the key not existing attempt to create the key
        return this.invokeDefaultsCommand(
            `write ${plistFile} ${this.DEV_MENU_SETTINGS} -dict-add ${property} -bool ${value}`,
        ).then(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
    }

    private invokeDefaultsCommand(command: string): Promise<string> {
        return this.nodeChildProcess.exec(`defaults ${command}`).then(res =>
            res.outcome.then((result: string) => {
                return result.toString().trim();
            }),
        );
    }
}
