import { OutputChannel, window } from 'vscode';
//import * as formatduration from 'format-duration';
// import * as timestamp from 'time-stamp';
import formatDuration = require('format-duration');
const timestamp = require('time-stamp');

export interface ILogger {
    logOutput(data: string): void;
    logError(data: string): void;
    logStart(data: string): void;
    logEnd(exitcode: number, duration: number): void;
}

export class OutputLogger implements ILogger {
    private static instance: OutputLogger;
    private channel: OutputChannel;
    private static readonly channelName: string = 'NAB developer extension';

    static getInstance(): OutputLogger {
        if (!this.instance) {
            this.instance = new OutputLogger();
        }
        return this.instance;
    }

    private constructor() {
        this.channel = window.createOutputChannel(OutputLogger.channelName);
    }
    logOutput(data: string): void {
        this.channel.appendLine(data);
    }
    logError(data: string): void {
        this.channel.appendLine(data);
    }
    logStart(data: string): void {
        this.channel.appendLine(`Started function ${data}.`);
    }
    logEnd(exitcode: number, duration: number): void {
        let text = logDataEnd(exitcode) + "Duration: " + formatDuration(duration);
        this.channel.appendLine(text);
    }
}

export class ConsoleLogger implements ILogger {
    private static instance: ConsoleLogger;

    static getInstance(): ConsoleLogger {
        if (!this.instance) {
            this.instance = new ConsoleLogger();
        }
        return this.instance;
    }

    logOutput(data: string): void {
        console.log(appendTimestamp(data));
    }
    logError(data: string): void {
        console.error(appendTimestamp(data));
    }
    logStart(command: string): void {
        console.log(appendTimestamp('Started function.\n\n' + command + '\n'));
    }
    logEnd(exitcode: number, duration: number): void {
        let text = logDataEnd(exitcode) + "Duration: " + formatDuration(duration) + '\n' + '-'.repeat(30);
        console.log(appendTimestamp(text));
    }
}

function logDataEnd(exitcode: number): string {
    if (exitcode === 0) {
        return "";
    }
    return "Something went wrong\n";
}

function appendTimestamp(line: string): string {
    return '[' + timestamp('HH:mm:ss') + '] ' + line;
}
