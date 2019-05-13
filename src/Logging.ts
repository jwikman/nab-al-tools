import { OutputChannel, window } from 'vscode';
//import * as formatduration from 'format-duration';
// import * as timestamp from 'time-stamp';
import formatDuration = require('format-duration');
const timestamp = require('time-stamp');

export interface ILogger {
    LogOutput(data: string):void;
    LogError(data: string):void;
    LogStart(data: string):void;
    LogEnd(exitcode: number, duration: number):void;
}

export class OutputLogger implements ILogger {
    private static instance: OutputLogger;
    private channel: OutputChannel;
    private static readonly channelName: string = 'NAB developer extension'; 
    
    static getInstance() {
        if(!this.instance) {
            this.instance = new OutputLogger();
        }
        return this.instance;
    }

    private constructor() {
        this.channel = window.createOutputChannel(OutputLogger.channelName);
    }
    LogOutput(data: string) {
        this.channel.appendLine(data);
    }
    LogError(data: string) {
        this.channel.appendLine(data);
    }
    LogStart(data: string) {
        this.channel.appendLine(`Started function ${data}.`);
    }
    LogEnd(exitcode: number, duration: number) {
        let text = logDataEnd(exitcode) + "Duration: " + formatDuration(duration);
        this.channel.appendLine(text);
    }
}

export class ConsoleLogger implements ILogger {
    private static instance: ConsoleLogger;

    static getInstance() {
        if(!this.instance) {
            this.instance = new ConsoleLogger();
        }
        return this.instance;
    }
    
    LogOutput(data: string) {
        console.log(appendTimestamp(data));
    }
    LogError(data: string) {
        console.error(appendTimestamp(data));
    }
    LogStart(command: string) {
        console.log(appendTimestamp('Started function.\n\n' + command + '\n'));
    }
    LogEnd(exitcode: number, duration: number) {
        let text = logDataEnd(exitcode) + "Duration: " + formatDuration(duration) + '\n' + '-'.repeat(30);
        console.log(appendTimestamp(text));
    }
}

function logDataEnd(exitcode: number) {
    if(exitcode === 0) {
        return "";
    }
    return "Something went wrong\n";
}

function appendTimestamp(line: string) {
    return '[' + timestamp('HH:mm:ss') + '] ' + line;
}
