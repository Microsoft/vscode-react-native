// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import { Code } from "./code";
import {IElement} from "./driver";

export class Editors {

    constructor(private code: Code) { }

    public async saveOpenedFile(): Promise<any> {
        if (process.platform === "darwin") {
            await this.code.dispatchKeybinding("cmd+s");
        } else {
            await this.code.dispatchKeybinding("ctrl+s");
        }
    }

    public async selectTab(fileName: string): Promise<void> {
        await this.code.waitAndClick(`.tabs-container div.tab[data-resource-name$="${fileName}"]`);
        await this.waitForEditorFocus(fileName);
    }

    public async waitForActiveEditor(fileName: string, retryCount: number = 2000, retryInterval: number = 100): Promise<any> {
        const selector = `.editor-instance .monaco-editor[data-uri$="${fileName}"] textarea`;
        return this.code.waitForActiveElement(selector, retryCount, retryInterval);
    }

    public async waitForEditorFocus(fileName: string, retryCount: number = 2000, retryInterval: number = 100): Promise<void> {
        await this.waitForActiveTab(fileName, false, false, retryCount, retryInterval);
        await this.waitForActiveEditor(fileName, retryCount, retryInterval);
    }

    public async waitForActiveTab(fileName: string, isDirty: boolean = false, isWebview?: boolean, retryCount: number = 2000, retryInterval: number = 100): Promise<void> {
        await this.code.waitForElement(`.tabs-container div.tab.active${isDirty ? ".dirty" : ""}[aria-selected="true"][${isWebview ? "title" : "data-resource-name$"}="${fileName}"]`, (result: IElement | undefined) => !!result, retryCount, retryInterval);
    }

    public async waitForTab(fileName: string, isDirty: boolean = false, isWebview?: boolean): Promise<void> {
        await this.code.waitForElement(`.tabs-container div.tab${isDirty ? ".dirty" : ""}[${isWebview ? "title" : "data-resource-name$"}="${fileName}"]`);
    }

    public async newUntitledFile(): Promise<void> {
        if (process.platform === "darwin") {
            await this.code.dispatchKeybinding("cmd+n");
        } else {
            await this.code.dispatchKeybinding("ctrl+n");
        }

        await this.waitForEditorFocus("Untitled-1");
    }

    public async scrollTop(): Promise<void> {
        if (process.platform === "darwin") {
            await this.code.dispatchKeybinding("cmd+home");
        } else {
            await this.code.dispatchKeybinding("ctrl+home");
        }
    }
}
