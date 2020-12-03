// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
import * as path from "path";

export function getFileNameWithoutExtension(fileName: string) {
    return path.basename(fileName, path.extname(fileName));
}

export function isNullOrUndefined(value: any): boolean {
    return typeof value === "undefined" || value === null;
}

export function getFormattedTimeString(date: Date): string {
    const hourString = padZeroes(2, String(date.getUTCHours()));
    const minuteString = padZeroes(2, String(date.getUTCMinutes()));
    const secondString = padZeroes(2, String(date.getUTCSeconds()));
    return `${hourString}:${minuteString}:${secondString}`;
}

export function getFormattedDateString(date: Date): string {
    return date.getUTCFullYear() + "-" + `${date.getUTCMonth() + 1}` + "-" + date.getUTCDate();
}

export function getFormattedDatetimeString(date: Date): string {
    return `${getFormattedDateString(date)} ${getFormattedTimeString(date)}`;
}

function padZeroes(minDesiredLength: number, numberToPad: string): string {
    if (numberToPad.length >= minDesiredLength) {
        return numberToPad;
    } else {
        return String("0".repeat(minDesiredLength) + numberToPad).slice(-minDesiredLength);
    }
}

export function stripJsonTrailingComma(str: string): string {
    const trailingCommaRegex = /(.*?),(\s*)(\}|])/g;
    const endOfStringTrailingCommaRegex = /,$/g;
    return str
        .replace(trailingCommaRegex, "$1$2$3")
        .replace(endOfStringTrailingCommaRegex, "");
}
