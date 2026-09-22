import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as PragmaSuppressionCore from "./PragmaSuppressionCore";

interface IJustificationQuickPickItem extends vscode.QuickPickItem {
  category: PragmaSuppressionCore.JustificationCategory;
}

/**
 * Command handler for `nab.suppressDiagnosticWithPragma`. Prompts the user for a
 * justification, then wraps the affected diagnostic(s) in `#pragma warning disable`/`restore`.
 */
export async function suppressDiagnosticWithPragma(
  documentUri: vscode.Uri,
  code: string,
  scope: PragmaSuppressionCore.SuppressionScope,
  diagnosticRange: vscode.Range
): Promise<void> {
  const justification = await pickJustification(scope, code);
  if (justification === undefined) {
    return;
  }

  const document = await vscode.workspace.openTextDocument(documentUri);
  const mergeGap = SettingsLoader.getSettings(documentUri.fsPath)
    .pragmaSuppressionMergeGap;

  if (scope === "occurrence") {
    const range: PragmaSuppressionCore.ILineRange = {
      startLine: diagnosticRange.start.line,
      endLine: diagnosticRange.end.line,
    };
    const edit = new vscode.WorkspaceEdit();
    edit.set(
      documentUri,
      PragmaSuppressionCore.buildSuppressionEdits(
        document,
        range,
        code,
        justification
      )
    );
    await applyAndReport(edit, 1);
    return;
  }

  if (scope === "file") {
    const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
      vscode.languages.getDiagnostics(documentUri),
      code,
      mergeGap
    );
    if (ranges.length === 0) {
      vscode.window.showInformationMessage(
        `No suppressible "${code}" diagnostics found in this file.`
      );
      return;
    }
    const edit = new vscode.WorkspaceEdit();
    edit.set(
      documentUri,
      ranges.flatMap((range) =>
        PragmaSuppressionCore.buildSuppressionEdits(
          document,
          range,
          code,
          justification
        )
      )
    );
    await applyAndReport(edit, ranges.length);
    return;
  }

  // scope === "app"
  const appFolder = findAppFolder(documentUri.fsPath);
  if (!appFolder) {
    vscode.window.showErrorMessage(
      'Could not determine the app folder ("app.json" not found) for the current file.'
    );
    return;
  }

  if (!(await confirmBackgroundCodeAnalysis(documentUri))) {
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  let totalRanges = 0;
  for (const [uri, fileDiagnostics] of vscode.languages.getDiagnostics()) {
    if (!isWithinFolder(uri.fsPath, appFolder)) {
      continue;
    }
    const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
      fileDiagnostics,
      code,
      mergeGap
    );
    if (ranges.length === 0) {
      continue;
    }
    const fileDocument = await vscode.workspace.openTextDocument(uri);
    edit.set(
      uri,
      ranges.flatMap((range) =>
        PragmaSuppressionCore.buildSuppressionEdits(
          fileDocument,
          range,
          code,
          justification
        )
      )
    );
    totalRanges += ranges.length;
  }

  if (totalRanges === 0) {
    vscode.window.showInformationMessage(
      `No suppressible "${code}" diagnostics found in this app.`
    );
    return;
  }
  await applyAndReport(edit, totalRanges);
}

/**
 * Prompts for a justification category (and free text for "Custom"), returning the
 * pragma comment text, or undefined if the user cancelled.
 */
async function pickJustification(
  scope: PragmaSuppressionCore.SuppressionScope,
  code: string
): Promise<string | undefined> {
  const options =
    scope === "occurrence"
      ? PragmaSuppressionCore.occurrenceJustificationOptions
      : PragmaSuppressionCore.bulkJustificationOptions;

  const items: IJustificationQuickPickItem[] = options.map((option) => ({
    label: option.label,
    category: option.category,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `Why is "${code}" being suppressed?`,
  });
  if (!picked) {
    return undefined;
  }

  let customText: string | undefined;
  if (picked.category === "custom") {
    customText = await vscode.window.showInputBox({
      prompt: `Justification for suppressing "${code}"`,
      ignoreFocusOut: true,
    });
    if (!customText || customText.trim().length === 0) {
      return undefined;
    }
  }

  return PragmaSuppressionCore.getJustificationText(
    picked.category,
    code,
    customText
  );
}

/**
 * Warns if `al.backgroundCodeAnalysis` isn't "Project" for the resource, since
 * diagnostics may then only be available for open files, causing "in this app"
 * to silently miss unanalyzed files.
 * @returns true if the caller should proceed
 */
async function confirmBackgroundCodeAnalysis(
  resource: vscode.Uri
): Promise<boolean> {
  const backgroundCodeAnalysis = vscode.workspace
    .getConfiguration("al", resource)
    .get<string>("backgroundCodeAnalysis");
  if (backgroundCodeAnalysis === "Project") {
    return true;
  }

  const proceedAnyway = "Proceed anyway";
  const answer = await vscode.window.showWarningMessage(
    `"al.backgroundCodeAnalysis" is not set to "Project" (currently "${backgroundCodeAnalysis}"). Diagnostics may only be available for already analyzed files, so "in this app" suppression could miss occurrences elsewhere in the app.`,
    { modal: true },
    proceedAnyway
  );
  return answer === proceedAnyway;
}

async function applyAndReport(
  edit: vscode.WorkspaceEdit,
  count: number
): Promise<void> {
  const success = await vscode.workspace.applyEdit(edit);
  if (success) {
    await saveEditedDocuments(edit);
    vscode.window.showInformationMessage(
      `Inserted ${count} #pragma warning disable/restore ${
        count === 1 ? "pair" : "pairs"
      }.`
    );
  } else {
    vscode.window.showErrorMessage(
      "Failed to apply the pragma suppression edit."
    );
  }
}

/**
 * Saves every document touched by `edit`, so pragma suppression edits don't
 * leave affected files dirty in the editor.
 */
export async function saveEditedDocuments(
  edit: vscode.WorkspaceEdit
): Promise<void> {
  for (const [uri] of edit.entries()) {
    const document = await vscode.workspace.openTextDocument(uri);
    if (document.isDirty) {
      await document.save();
    }
  }
}

/**
 * Walks up from `filePath` to find the folder containing the nearest `app.json`.
 */
function findAppFolder(filePath: string): string | undefined {
  let dir = path.dirname(filePath);
  for (;;) {
    if (fs.existsSync(path.join(dir, "app.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

function isWithinFolder(filePath: string, folder: string): boolean {
  const relative = path.relative(folder, filePath);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}
