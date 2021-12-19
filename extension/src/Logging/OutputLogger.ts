import { OutputChannel, window } from "vscode";
import { ILogger, appendTimestamp } from "./LogHelper";

export class OutputLogger implements ILogger {
  private static instance: OutputLogger;
  private channel: OutputChannel;
  private static readonly channelName: string = "NAB AL Tools";

  static getInstance(): OutputLogger {
    if (!this.instance) {
      this.instance = new OutputLogger();
    }
    return this.instance;
  }

  private constructor() {
    this.channel = window.createOutputChannel(OutputLogger.channelName);
  }
  log(message?: string, ...optionalParams: string[]): void {
    if (message) {
      this.channel.appendLine(appendTimestamp(message));
      for (const line of optionalParams) {
        this.channel.appendLine(line);
      }
    }
  }
  error(data: string): void {
    this.channel.appendLine(appendTimestamp("ERROR: " + data));
  }
}
