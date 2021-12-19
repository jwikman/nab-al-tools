import { ILogger, appendTimestamp } from "./LogHelper";

export class ConsoleLogger implements ILogger {
  private static instance: ConsoleLogger;

  static getInstance(): ConsoleLogger {
    if (!this.instance) {
      this.instance = new ConsoleLogger();
    }
    return this.instance;
  }

  log(message?: string, ...optionalParams: string[]): void {
    console.log(appendTimestamp(message), optionalParams);
  }
  error(message?: string, ...optionalParams: string[]): void {
    console.error(appendTimestamp(message), optionalParams);
  }
}
