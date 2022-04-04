import * as vscode from "vscode";
import { logger } from "./Logging/LogHelper";
import * as Telemetry from "./Telemetry/Telemetry";

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

enum DialogType {
  information,
  warning,
  error,
}

export async function showMessage(
  message: string,
  showActions = false,
  dialogType: DialogType = DialogType.information,
  modal = false,
  detail?: string
): Promise<boolean> {
  let dialog = vscode.window.showInformationMessage;
  switch (dialogType) {
    case DialogType.warning:
      dialog = vscode.window.showWarningMessage;
      break;
    case DialogType.error:
      dialog = vscode.window.showErrorMessage;
      break;
  }
  const msgOpt: vscode.MessageOptions = { modal: modal, detail: detail };
  const noItem: vscode.MessageItem = {
    isCloseAffordance: true,
    title: "No",
  };
  const yesItem: vscode.MessageItem = {
    isCloseAffordance: false,
    title: "Yes",
  };

  const msgItems: vscode.MessageItem[] = showActions ? [noItem, yesItem] : [];
  return new Promise<boolean>((resolve) => {
    dialog(message, msgOpt, ...msgItems).then((msgItem) => {
      resolve(msgItem === yesItem);
    });
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
