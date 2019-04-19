// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

/**
 * Logging utility class.
 */
import * as path from "path";
import * as mkdirp from "mkdirp";
export enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warning = 3,
    Error = 4,
    None = 5,
}

export interface ILogger {
    log: (message: string, level: LogLevel) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    error: (errorMessage: string, error?: Error, stack?: boolean) => void;
    debug: (message: string) => void;
    logStream: (data: Buffer | String, stream?: NodeJS.WritableStream) => void;
}

export class LogHelper {
    public static get LOG_LEVEL(): LogLevel {
        return getLogLevel();
    }
}

/**
 * Returns directory in which the extension's log files will be saved
 * if `env` variables `REACT_NATIVE_TOOLS_LOGS_DIR` and `REACT_NATIVE_TOOLS_LOGS_TIMESTAMP` is defined
 * @param filename Name of the file to be added to the logs path
 * @param createDir If true the directory will be created, if the returned directory path is correct. If it already exists - no action
 * @returns Path to the logs folder, or path to the log file, or null
 */
export function getLoggingDirectory(createDir?: boolean, filename?: string): string | null {
   if (process.env.REACT_NATIVE_TOOLS_LOGS_DIR && process.env.REACT_NATIVE_TOOLS_LOGS_TIMESTAMP) {
        let dirPath = path.join(process.env.REACT_NATIVE_TOOLS_LOGS_DIR, process.env.REACT_NATIVE_TOOLS_LOGS_TIMESTAMP);
        if (!path.isAbsolute(dirPath)) {
            return null;
        }
        if (createDir) {
            mkdirp(dirPath, () => {});
        }
        dirPath = filename ? path.join(dirPath, filename) : dirPath;
        return dirPath;
   }
   return null;
}

function getLogLevel() {
    try {
        const SettingsHelper = require("../settingsHelper").SettingsHelper;
        return SettingsHelper.getLogLevel();
    } catch (err) { // Debugger context
        return LogLevel.Info; // Default
    }
}
