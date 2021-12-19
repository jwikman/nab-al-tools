import { ILogger } from "./LogHelper";

export let logger: ILogger;

export function setLogger(newLogger: ILogger): void {
  logger = newLogger;
}
