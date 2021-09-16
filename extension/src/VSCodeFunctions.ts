import * as vscode from "vscode";

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
