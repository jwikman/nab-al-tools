import { ILogger } from "./LogHelper";
import { NullLogger } from "./NullLogger";

export let logger: ILogger = new NullLogger();

export function setLogger(newLogger: ILogger): void {
  logger = newLogger;
}
