import { OutputChannel, window } from "vscode";
import { ILogger } from "./ILogger";
import { appendTimestamp } from "./LogHelper";

export class OutputLogger implements ILogger {
  private static instance: OutputLogger;
  private channel: OutputChannel;
  public static readonly channelName: string = "NAB AL Tools";

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
    } else {
      this.channel.appendLine("");
    }
  }
  error(message?: string, ...optionalParams: string[]): void {
    if (message) {
      this.channel.appendLine(appendTimestamp("ERROR: " + message));
      for (const line of optionalParams) {
        this.channel.appendLine(line);
      }
    } else {
      this.channel.appendLine("");
    }
  }
  show(): void {
    this.channel.show();
  }
  clear(): void {
    this.channel.clear();
  }
}
