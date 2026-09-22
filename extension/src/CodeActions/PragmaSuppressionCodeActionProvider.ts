import * as vscode from "vscode";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as PragmaSuppressionCore from "./PragmaSuppressionCore";

export const suppressDiagnosticWithPragmaCommand =
  "nab.suppressDiagnosticWithPragma";

/**
 * Offers "NAB: Suppress <code>" quick-fix code actions for suppressible AL diagnostics,
 * wrapping the affected line(s) in `#pragma warning disable`/`restore`.
 * Registered only for the `al` language; no-op unless `NAB.EnableCodeActions` is enabled
 * for the resource's workspace folder.
 */
export class PragmaSuppressionCodeActionProvider
  implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const settings = SettingsLoader.getSettings(document.uri.fsPath);
    if (!settings.enableCodeActions) {
      return [];
    }

    const actions: vscode.CodeAction[] = [];
    const handledCodes = new Set<string>();
    for (const diagnostic of context.diagnostics) {
      if (!PragmaSuppressionCore.isSuppressible(diagnostic)) {
        continue;
      }
      const code = PragmaSuppressionCore.getDiagnosticCode(diagnostic);
      if (!code) {
        continue;
      }
      // Avoid duplicate action sets when multiple diagnostics with the same
      // code/location are reported (e.g. by more than one analyzer).
      const key = `${code}:${diagnostic.range.start.line}`;
      if (handledCodes.has(key)) {
        continue;
      }
      handledCodes.add(key);

      actions.push(
        this.createAction(
          `NAB: Suppress ${code}`,
          document,
          diagnostic,
          code,
          "occurrence"
        )
      );
      actions.push(
        this.createAction(
          `NAB: Suppress ${code} in this file`,
          document,
          diagnostic,
          code,
          "file"
        )
      );
      actions.push(
        this.createAction(
          `NAB: Suppress ${code} in this app`,
          document,
          diagnostic,
          code,
          "app"
        )
      );
    }
    return actions;
  }

  private createAction(
    title: string,
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    code: string,
    scope: PragmaSuppressionCore.SuppressionScope
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];
    action.command = {
      command: suppressDiagnosticWithPragmaCommand,
      title,
      arguments: [document.uri, code, scope, diagnostic.range],
    };
    return action;
  }
}
