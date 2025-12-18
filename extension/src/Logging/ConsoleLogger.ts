import { ILogger } from "./ILogger";
import { appendTimestamp } from "./LogHelper";

export class ConsoleLogger implements ILogger {
  private static instance: ConsoleLogger;
  private useTimestamps: boolean = true;

  static getInstance(): ConsoleLogger {
    if (!this.instance) {
      this.instance = new ConsoleLogger();
    }
    return this.instance;
  }

  setUseTimestamps(value: boolean): void {
    this.useTimestamps = value;
  }

  log(message?: string, ...optionalParams: string[]): void {
    const msg = this.useTimestamps ? appendTimestamp(message) : message;
    if (optionalParams.length === 0) {
      console.log(msg);
    } else {
      console.log(msg, optionalParams);
    }
  }
  error(message?: string, ...optionalParams: string[]): void {
    const msg = this.useTimestamps ? appendTimestamp(message) : message;
    if (optionalParams.length === 0) {
      console.error(msg);
    } else {
      console.error(msg, optionalParams);
    }
  }
  show(): void {
    // Do nothing
  }
}
