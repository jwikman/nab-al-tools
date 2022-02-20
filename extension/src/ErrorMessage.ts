import * as vscode from "vscode";
import { logger } from "./Logging/LogHelper";
import * as Telemetry from "./Telemetry";

export function showErrorAndLog(
  action: string,
  error: Error,
  modal = false
): void {
  const errMsg = `${action} failed with error: ${error.message}`;
  vscode.window.showErrorMessage(errMsg, { modal: modal });
  logger.log(`Error: ${error.message}`);
  logger.log(`Stack trace: ${error.stack}`);
  Telemetry.trackException(error);
}
