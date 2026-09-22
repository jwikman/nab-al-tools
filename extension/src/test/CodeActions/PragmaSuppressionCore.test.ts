import * as vscode from "vscode";
import * as assert from "assert";
import * as PragmaSuppressionCore from "../../CodeActions/PragmaSuppressionCore";

function createDiagnostic(
  startLine: number,
  endLine: number,
  code:
    | string
    | number
    | { value: string | number; target: vscode.Uri }
    | undefined,
  severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Warning
): vscode.Diagnostic {
  const range = new vscode.Range(startLine, 0, endLine, 10);
  const diagnostic = new vscode.Diagnostic(range, "message", severity);
  diagnostic.code = code;
  return diagnostic;
}

suite("PragmaSuppressionCore", function () {
  suite("getDiagnosticCode", function () {
    test("returns undefined when code is undefined", function () {
      const diagnostic = createDiagnostic(0, 0, undefined);
      assert.strictEqual(
        PragmaSuppressionCore.getDiagnosticCode(diagnostic),
        undefined
      );
    });

    test("returns string code as-is", function () {
      const diagnostic = createDiagnostic(0, 0, "PC0030");
      assert.strictEqual(
        PragmaSuppressionCore.getDiagnosticCode(diagnostic),
        "PC0030"
      );
    });

    test("returns numeric code as string", function () {
      const diagnostic = createDiagnostic(0, 0, 468);
      assert.strictEqual(
        PragmaSuppressionCore.getDiagnosticCode(diagnostic),
        "468"
      );
    });

    test("returns value from object code", function () {
      const diagnostic = createDiagnostic(0, 0, {
        value: "PC0038",
        target: vscode.Uri.parse("https://example.com"),
      });
      assert.strictEqual(
        PragmaSuppressionCore.getDiagnosticCode(diagnostic),
        "PC0038"
      );
    });
  });

  suite("isSuppressible", function () {
    test("returns false for Error severity", function () {
      const diagnostic = createDiagnostic(
        0,
        0,
        "AL0001",
        vscode.DiagnosticSeverity.Error
      );
      assert.strictEqual(
        PragmaSuppressionCore.isSuppressible(diagnostic),
        false
      );
    });

    test("returns false when code is missing", function () {
      const diagnostic = createDiagnostic(0, 0, undefined);
      assert.strictEqual(
        PragmaSuppressionCore.isSuppressible(diagnostic),
        false
      );
    });

    test("returns true for Warning severity with a code", function () {
      const diagnostic = createDiagnostic(0, 0, "PC0030");
      assert.strictEqual(
        PragmaSuppressionCore.isSuppressible(diagnostic),
        true
      );
    });

    test("returns true for Information severity with a code", function () {
      const diagnostic = createDiagnostic(
        0,
        0,
        "PC0030",
        vscode.DiagnosticSeverity.Information
      );
      assert.strictEqual(
        PragmaSuppressionCore.isSuppressible(diagnostic),
        true
      );
    });
  });

  suite("getJustificationText", function () {
    test("todo includes the rule code", function () {
      assert.strictEqual(
        PragmaSuppressionCore.getJustificationText("todo", "PC0030"),
        "TODO: Fix PC0030"
      );
    });

    test("byDesign", function () {
      assert.strictEqual(
        PragmaSuppressionCore.getJustificationText("byDesign", "PC0030"),
        "By design"
      );
    });

    test("legacyCode", function () {
      assert.strictEqual(
        PragmaSuppressionCore.getJustificationText("legacyCode", "PC0030"),
        "Legacy code"
      );
    });

    test("falsePositive", function () {
      assert.strictEqual(
        PragmaSuppressionCore.getJustificationText("falsePositive", "PC0030"),
        "False positive"
      );
    });

    test("custom returns the trimmed custom text", function () {
      assert.strictEqual(
        PragmaSuppressionCore.getJustificationText(
          "custom",
          "PC0030",
          "  Because reasons  "
        ),
        "Because reasons"
      );
    });

    test("custom with no text returns empty string", function () {
      assert.strictEqual(
        PragmaSuppressionCore.getJustificationText("custom", "PC0030"),
        ""
      );
    });
  });

  suite("mergeDiagnosticRanges", function () {
    test("returns a single range for a single diagnostic", function () {
      const diagnostics = [createDiagnostic(5, 5, "PC0030")];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [{ startLine: 5, endLine: 5 }]);
    });

    test("merges strictly adjacent diagnostics when mergeGap is 0", function () {
      const diagnostics = [
        createDiagnostic(5, 5, "PC0030"),
        createDiagnostic(6, 6, "PC0030"),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [{ startLine: 5, endLine: 6 }]);
    });

    test("does not merge across a gap when mergeGap is 0", function () {
      const diagnostics = [
        createDiagnostic(5, 5, "PC0030"),
        createDiagnostic(7, 7, "PC0030"),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [
        { startLine: 5, endLine: 5 },
        { startLine: 7, endLine: 7 },
      ]);
    });

    test("merges across a 1-line gap when mergeGap is 1", function () {
      const diagnostics = [
        createDiagnostic(5, 5, "PC0030"),
        createDiagnostic(7, 7, "PC0030"),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        1
      );
      assert.deepStrictEqual(ranges, [{ startLine: 5, endLine: 7 }]);
    });

    test("ignores diagnostics with a different code", function () {
      const diagnostics = [
        createDiagnostic(5, 5, "PC0030"),
        createDiagnostic(6, 6, "PC0038"),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [{ startLine: 5, endLine: 5 }]);
    });

    test("ignores diagnostics with Error severity", function () {
      const diagnostics = [
        createDiagnostic(5, 5, "PC0030"),
        createDiagnostic(6, 6, "PC0030", vscode.DiagnosticSeverity.Error),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [{ startLine: 5, endLine: 5 }]);
    });

    test("sorts unsorted input before merging", function () {
      const diagnostics = [
        createDiagnostic(10, 10, "PC0030"),
        createDiagnostic(5, 5, "PC0030"),
        createDiagnostic(6, 6, "PC0030"),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [
        { startLine: 5, endLine: 6 },
        { startLine: 10, endLine: 10 },
      ]);
    });

    test("uses the max end line for overlapping multi-line diagnostics", function () {
      const diagnostics = [
        createDiagnostic(5, 8, "PC0030"),
        createDiagnostic(7, 9, "PC0030"),
      ];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, [{ startLine: 5, endLine: 9 }]);
    });

    test("returns an empty array when nothing matches", function () {
      const diagnostics = [createDiagnostic(5, 5, "PC0038")];
      const ranges = PragmaSuppressionCore.mergeDiagnosticRanges(
        diagnostics,
        "PC0030",
        0
      );
      assert.deepStrictEqual(ranges, []);
    });
  });

  suite("buildSuppressionEdits", function () {
    test("inserts disable before and restore after the range, preserving indentation", async function () {
      const document = await vscode.workspace.openTextDocument({
        content:
          "codeunit 50100 MyCodeunit\n{\n    procedure Foo()\n    begin\n    end;\n}\n",
        language: "al",
      });
      const edits = PragmaSuppressionCore.buildSuppressionEdits(
        document,
        { startLine: 2, endLine: 2 },
        "PC0030",
        "TODO: Fix PC0030"
      );
      assert.strictEqual(edits.length, 2, "expected 2 edits");
      assert.strictEqual(
        edits[0].newText,
        "    #pragma warning disable PC0030 // TODO: Fix PC0030\n"
      );
      assert.strictEqual(edits[0].range.start.line, 2);
      assert.strictEqual(edits[0].range.start.character, 0);
      assert.strictEqual(
        edits[1].newText,
        "\n    #pragma warning restore PC0030"
      );
      assert.strictEqual(edits[1].range.start.line, 2);
    });

    test("omits the trailing comment when tagText is empty", async function () {
      const document = await vscode.workspace.openTextDocument({
        content: "procedure Foo()\nend;\n",
        language: "al",
      });
      const edits = PragmaSuppressionCore.buildSuppressionEdits(
        document,
        { startLine: 0, endLine: 0 },
        "PC0030",
        ""
      );
      assert.strictEqual(edits[0].newText, "#pragma warning disable PC0030\n");
    });

    test("spans multiple lines using startLine indentation", async function () {
      const document = await vscode.workspace.openTextDocument({
        content: "  line0\n  line1\n  line2\n  line3\n",
        language: "plaintext",
      });
      const edits = PragmaSuppressionCore.buildSuppressionEdits(
        document,
        { startLine: 1, endLine: 2 },
        "PC0030",
        "Legacy code"
      );
      assert.strictEqual(edits[0].range.start.line, 1);
      assert.strictEqual(edits[1].range.start.line, 2);
      assert.strictEqual(
        edits[0].newText,
        "  #pragma warning disable PC0030 // Legacy code\n"
      );
      assert.strictEqual(
        edits[1].newText,
        "\n  #pragma warning restore PC0030"
      );
    });
  });
});
