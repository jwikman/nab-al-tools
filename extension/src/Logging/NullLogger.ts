/* eslint-disable @typescript-eslint/no-unused-vars */
import { ILogger } from "./LogHelper";

export class NullLogger implements ILogger {
  log(_message?: string, ..._optionalParams: string[]): void {
    // Do nothing
  }
  error(_message?: string, ..._optionalParams: string[]): void {
    // Do nothing
  }
}