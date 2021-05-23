import * as vscode from "vscode";
import * as compareVersions from "compare-versions";

export async function findTextInFiles(
  textToSearchFor: string,
  useRegex: boolean,
  filesToIncludeFilter = ""
): Promise<void> {
  if (
    compareVersions(vscode.version, "1.34.0") >= 0 ||
    vscode.env.appRoot === "d:\\VSCode\\Git\\vscode"
  ) {
    await vscode.commands.executeCommand("workbench.action.findInFiles", {
      query: textToSearchFor,
      triggerSearch: true,
      isRegex: useRegex,
      isCaseSensitive: false,
      matchWholeWord: false,
      filesToInclude: filesToIncludeFilter,
    });
  } else {
    await vscode.env.clipboard.writeText(textToSearchFor);
    await vscode.commands.executeCommand("workbench.action.findInFiles");
    setTimeout(async () => {
      await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );
      if (useRegex) {
        await vscode.commands.executeCommand("toggleSearchRegex");
      } else {
        // Twice to trigger search
        await vscode.commands.executeCommand("toggleSearchRegex");
        await vscode.commands.executeCommand("toggleSearchRegex");
      }
    }, 100);
  }
}
