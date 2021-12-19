// eslint-disable-next-line @typescript-eslint/no-var-requires
const timestamp = require("time-stamp");

export interface ILogger {
  log(message?: string, ...optionalParams: string[]): void;
  error(message?: string, ...optionalParams: string[]): void;
}

export function logDataEnd(exitCode: number): string {
  if (exitCode === 0) {
    return "";
  }
  return "Something went wrong\n";
}

export function appendTimestamp(line?: string): string {
  return "[" + timestamp("HH:mm:ss") + "] " + line;
}
