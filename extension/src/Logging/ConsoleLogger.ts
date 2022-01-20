import { ILogger } from "./ILogger";
import { appendTimestamp } from "./LogHelper";

export class ConsoleLogger implements ILogger {
  private static instance: ConsoleLogger;

  static getInstance(): ConsoleLogger {
    if (!this.instance) {
      this.instance = new ConsoleLogger();
    }
    return this.instance;
  }

  log(message?: string, ...optionalParams: string[]): void {
    if (optionalParams.length === 0) {
      console.log(appendTimestamp(message));
    } else {
      console.log(appendTimestamp(message), optionalParams);
    }
  }
  error(message?: string, ...optionalParams: string[]): void {
    if (optionalParams.length === 0) {
      console.error(appendTimestamp(message));
    } else {
      console.error(appendTimestamp(message), optionalParams);
    }
  }
}
