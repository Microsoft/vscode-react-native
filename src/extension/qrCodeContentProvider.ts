// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as qr from "qr-image";
import { TextDocumentContentProvider, Uri } from "vscode";
import * as nls from "vscode-nls";
const localize = nls.loadMessageBundle();

export class QRCodeContentProvider implements TextDocumentContentProvider {

    private cache: { [uri: string]: string } = {};

    public provideTextDocumentContent(uri: Uri): string {

        let stringUri = uri.toString();

        if (!this.cache[stringUri]) {
            const imageBuffer: NodeBuffer = qr.imageSync(stringUri);
            this.cache[stringUri] = "data:image/png;base64," + imageBuffer.toString("base64");
        }
        let message = localize("QRCodeInstructions", "Expo is running. Open your Expo app at<br/> \n <span style=\"text-decoration: underline\">{0}</span><br/> \n or scan QR code below:", stringUri);
        return `<!DOCTYPE html>
        <html>
        <body>
            <div style="text-align:center">
                <h3>
                    ${message}
                <h3>
                <img src="${this.cache[stringUri]}" />
            </div>
        </body>
        </html>`;
    }
}
