// eslint-disable-next-line @typescript-eslint/no-var-requires
const timestamp = require("time-stamp");
import { ILogger } from "./ILogger";
import { NullLogger } from "./NullLogger";

export let logger: ILogger = new NullLogger();

export function setLogger(newLogger: ILogger): void {
  logger = newLogger;
}

export function appendTimestamp(line?: string): string {
  return "[" + timestamp("HH:mm:ss") + "] " + line;
}
