import * as vscode from "vscode";
import { logger } from "./Logging/LogHelper";
import * as Telemetry from "./Telemetry";

export async function findTextInFiles(
  textToSearchFor: string,
  useRegex: boolean,
  filesToIncludeFilter = ""
): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.findInFiles", {
    query: textToSearchFor,
    triggerSearch: true,
    isRegex: useRegex,
    isCaseSensitive: false,
    matchWholeWord: false,
    filesToInclude: filesToIncludeFilter,
  });
}

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

export async function commandExists(
  command: string,
  filterInternal = true
): Promise<boolean> {
  const cmd = await vscode.commands.getCommands(filterInternal);
  return cmd.find((c) => c === command) !== undefined;
}
