export interface ILogger {
  log(message?: string, ...optionalParams: string[]): void;
  error(message?: string, ...optionalParams: string[]): void;
}
