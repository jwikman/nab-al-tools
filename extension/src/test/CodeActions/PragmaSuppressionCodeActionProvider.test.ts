import * as vscode from "vscode";
import * as assert from "assert";
import { PragmaSuppressionCodeActionProvider } from "../../CodeActions/PragmaSuppressionCodeActionProvider";

function createDiagnostic(
  startLine: number,
  code: string | undefined,
  severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Warning
): vscode.Diagnostic {
  const range = new vscode.Range(startLine, 0, startLine, 10);
  const diagnostic = new vscode.Diagnostic(range, "message", severity);
  diagnostic.code = code;
  return diagnostic;
}

suite("PragmaSuppressionCodeActionProvider", function () {
  let document: vscode.TextDocument;
  const provider = new PragmaSuppressionCodeActionProvider();

  suiteSetup(async function () {
    document = await vscode.workspace.openTextDocument({
      content:
        "codeunit 50100 MyCodeunit\n{\n    procedure Foo()\n    end;\n}\n",
      language: "al",
    });
  });

  teardown(async function () {
    await vscode.workspace
      .getConfiguration("NAB")
      .update(
        "EnableCodeActions",
        undefined,
        vscode.ConfigurationTarget.Global
      );
  });

  test("returns no actions when NAB.EnableCodeActions is disabled (default)", function () {
    const context: vscode.CodeActionContext = {
      diagnostics: [createDiagnostic(2, "PC0030")],
      triggerKind: vscode.CodeActionTriggerKind.Automatic,
      only: undefined,
    };
    const actions = provider.provideCodeActions(
      document,
      new vscode.Range(2, 0, 2, 0),
      context
    );
    assert.strictEqual(actions?.length ?? 0, 0);
  });

  test("returns 3 actions for a suppressible diagnostic when enabled", async function () {
    await vscode.workspace
      .getConfiguration("NAB")
      .update("EnableCodeActions", true, vscode.ConfigurationTarget.Global);

    const diagnostic = createDiagnostic(2, "PC0030");
    const context: vscode.CodeActionContext = {
      diagnostics: [diagnostic],
      triggerKind: vscode.CodeActionTriggerKind.Automatic,
      only: undefined,
    };
    const actions = provider.provideCodeActions(
      document,
      new vscode.Range(2, 0, 2, 0),
      context
    ) as vscode.CodeAction[];

    assert.strictEqual(actions.length, 3, "expected 3 code actions");
    assert.strictEqual(actions[0].title, "NAB: Suppress PC0030");
    assert.strictEqual(actions[1].title, "NAB: Suppress PC0030 in this file");
    assert.strictEqual(actions[2].title, "NAB: Suppress PC0030 in this app");

    for (const action of actions) {
      assert.strictEqual(
        action.command?.command,
        "nab.suppressDiagnosticWithPragma"
      );
      assert.strictEqual(action.command?.arguments?.[1], "PC0030");
      assert.strictEqual(
        action.kind?.value,
        vscode.CodeActionKind.QuickFix.value
      );
    }
    assert.strictEqual(actions[0].command?.arguments?.[2], "occurrence");
    assert.strictEqual(actions[1].command?.arguments?.[2], "file");
    assert.strictEqual(actions[2].command?.arguments?.[2], "app");
  });

  test("returns no actions for Error severity diagnostics", async function () {
    await vscode.workspace
      .getConfiguration("NAB")
      .update("EnableCodeActions", true, vscode.ConfigurationTarget.Global);

    const diagnostic = createDiagnostic(
      2,
      "AL0001",
      vscode.DiagnosticSeverity.Error
    );
    const context: vscode.CodeActionContext = {
      diagnostics: [diagnostic],
      triggerKind: vscode.CodeActionTriggerKind.Automatic,
      only: undefined,
    };
    const actions = provider.provideCodeActions(
      document,
      new vscode.Range(2, 0, 2, 0),
      context
    );
    assert.strictEqual(actions?.length ?? 0, 0);
  });

  test("returns no actions for diagnostics without a code", async function () {
    await vscode.workspace
      .getConfiguration("NAB")
      .update("EnableCodeActions", true, vscode.ConfigurationTarget.Global);

    const diagnostic = createDiagnostic(2, undefined);
    const context: vscode.CodeActionContext = {
      diagnostics: [diagnostic],
      triggerKind: vscode.CodeActionTriggerKind.Automatic,
      only: undefined,
    };
    const actions = provider.provideCodeActions(
      document,
      new vscode.Range(2, 0, 2, 0),
      context
    );
    assert.strictEqual(actions?.length ?? 0, 0);
  });

  test("deduplicates when multiple diagnostics share the same code and start line", async function () {
    await vscode.workspace
      .getConfiguration("NAB")
      .update("EnableCodeActions", true, vscode.ConfigurationTarget.Global);

    const context: vscode.CodeActionContext = {
      diagnostics: [
        createDiagnostic(2, "PC0030"),
        createDiagnostic(2, "PC0030"),
      ],
      triggerKind: vscode.CodeActionTriggerKind.Automatic,
      only: undefined,
    };
    const actions = provider.provideCodeActions(
      document,
      new vscode.Range(2, 0, 2, 0),
      context
    ) as vscode.CodeAction[];
    assert.strictEqual(actions.length, 3);
  });
});
