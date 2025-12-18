import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import {
  OpenFileTool,
  IOpenFileParameters,
} from "../../ChatTools/OpenFileTool";

suite("OpenFileTool", function () {
  let tool: OpenFileTool;
  const testFilePath = path.resolve(
    __dirname,
    "../../../src/test/resources/NAB_AL_Tools.sv-SE.xlf"
  );
  const nonExistentFile = path.resolve(__dirname, "non-existent-file.txt");

  suiteSetup(function () {
    tool = new OpenFileTool();
  });

  test("should require filePath parameter", async function () {
    const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
      input: {} as IOpenFileParameters,
      toolInvocationToken: undefined,
    };
    const token = new vscode.CancellationTokenSource().token;

    const result = await tool.invoke(options, token);
    assert.strictEqual(result.content.length, 1);
    assert.ok(
      result.content[0] instanceof vscode.LanguageModelTextPart,
      "Expected text part"
    );
    const content = (result.content[0] as vscode.LanguageModelTextPart).value;
    assert.ok(
      content.includes("Error: filePath parameter is required"),
      `Expected error message, got: ${content}`
    );
  });

  test("should return error for non-existent file", async function () {
    const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
      input: {
        filePath: nonExistentFile,
      },
      toolInvocationToken: undefined,
    };
    const token = new vscode.CancellationTokenSource().token;

    const result = await tool.invoke(options, token);
    assert.strictEqual(result.content.length, 1);
    assert.ok(
      result.content[0] instanceof vscode.LanguageModelTextPart,
      "Expected text part"
    );
    const content = (result.content[0] as vscode.LanguageModelTextPart).value;
    assert.ok(
      content.includes("Error: File does not exist"),
      `Expected file not found error, got: ${content}`
    );
    assert.ok(
      content.includes(nonExistentFile),
      `Expected file path in error message, got: ${content}`
    );
  });

  test("should handle cancellation", async function () {
    const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
      input: {
        filePath: testFilePath,
      },
      toolInvocationToken: undefined,
    };
    const tokenSource = new vscode.CancellationTokenSource();
    tokenSource.cancel(); // Cancel immediately

    const result = await tool.invoke(options, tokenSource.token);
    assert.strictEqual(result.content.length, 1);
    assert.ok(
      result.content[0] instanceof vscode.LanguageModelTextPart,
      "Expected text part"
    );
    const content = (result.content[0] as vscode.LanguageModelTextPart).value;
    assert.ok(
      content.includes("Operation cancelled by user"),
      `Expected cancellation message, got: ${content}`
    );
  });

  test("should successfully open existing file", async function () {
    const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
      input: {
        filePath: testFilePath,
      },
      toolInvocationToken: undefined,
    };
    const token = new vscode.CancellationTokenSource().token;

    const result = await tool.invoke(options, token);
    assert.strictEqual(result.content.length, 1);
    assert.ok(
      result.content[0] instanceof vscode.LanguageModelTextPart,
      "Expected text part"
    );
    const content = (result.content[0] as vscode.LanguageModelTextPart).value;
    assert.ok(
      content.includes("Successfully opened and focused file") ||
        content.includes("Focused on already open file"),
      `Expected success message, got: ${content}`
    );
    assert.ok(
      content.includes(testFilePath),
      `Expected file path in success message, got: ${content}`
    );
  });

  test("should successfully open existing file with line and column", async function () {
    const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
      input: {
        filePath: testFilePath,
        line: 5,
        column: 10,
      },
      toolInvocationToken: undefined,
    };
    const token = new vscode.CancellationTokenSource().token;

    const result = await tool.invoke(options, token);
    assert.strictEqual(result.content.length, 1);
    assert.ok(
      result.content[0] instanceof vscode.LanguageModelTextPart,
      "Expected text part"
    );
    const content = (result.content[0] as vscode.LanguageModelTextPart).value;
    assert.ok(
      content.includes("Successfully opened and focused file") ||
        content.includes("Focused on already open file"),
      `Expected success message, got: ${content}`
    );
    assert.ok(
      content.includes("at line 5, column 10"),
      `Expected position info in success message, got: ${content}`
    );
  });

  test("should prepare invocation message correctly", async function () {
    const options: vscode.LanguageModelToolInvocationPrepareOptions<IOpenFileParameters> = {
      input: {
        filePath: testFilePath,
        line: 10,
        column: 5,
      },
    };

    const result = await tool.prepareInvocation(options);
    assert.ok(
      result.invocationMessage.includes(`Opening file "${testFilePath}"`),
      `Expected file path in invocation message, got: ${result.invocationMessage}`
    );
    assert.ok(
      result.invocationMessage.includes("at line 10, column 5"),
      `Expected position info in invocation message, got: ${result.invocationMessage}`
    );
    assert.strictEqual(result.confirmationMessages.title, "Open File");
    assert.ok(
      result.confirmationMessages.message.value.includes(testFilePath),
      "Expected file path in confirmation message"
    );
  });

  test("should prepare invocation message without position", async function () {
    const options: vscode.LanguageModelToolInvocationPrepareOptions<IOpenFileParameters> = {
      input: {
        filePath: testFilePath,
      },
    };

    const result = await tool.prepareInvocation(options);
    assert.ok(
      result.invocationMessage.includes(`Opening file "${testFilePath}"`),
      `Expected file path in invocation message, got: ${result.invocationMessage}`
    );
    assert.ok(
      !result.invocationMessage.includes("at line"),
      `Expected no position info in invocation message, got: ${result.invocationMessage}`
    );
  });

  test("should prepare invocation message with line only", async function () {
    const options: vscode.LanguageModelToolInvocationPrepareOptions<IOpenFileParameters> = {
      input: {
        filePath: testFilePath,
        line: 42,
      },
    };

    const result = await tool.prepareInvocation(options);
    assert.ok(
      result.invocationMessage.includes("at line 42"),
      `Expected line info without column in invocation message, got: ${result.invocationMessage}`
    );
    assert.ok(
      !result.invocationMessage.includes("column"),
      `Expected no column info when not provided, got: ${result.invocationMessage}`
    );
  });

  test("should handle relative path when workspace is available", async function () {
    // Skip this test if no workspace is open
    if (
      !vscode.workspace.workspaceFolders ||
      vscode.workspace.workspaceFolders.length === 0
    ) {
      this.skip();
      return;
    }

    const relativePath = "src/test/resources/NAB_AL_Tools.sv-SE.xlf";
    const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
      input: {
        filePath: relativePath,
      },
      toolInvocationToken: undefined,
    };
    const token = new vscode.CancellationTokenSource().token;

    const result = await tool.invoke(options, token);
    assert.strictEqual(result.content.length, 1);
    assert.ok(
      result.content[0] instanceof vscode.LanguageModelTextPart,
      "Expected text part"
    );
    const content = (result.content[0] as vscode.LanguageModelTextPart).value;

    // Should either succeed (if file exists) or fail with file not found (not workspace error)
    assert.ok(
      !content.includes("No workspace is open"),
      `Expected to handle relative path with workspace, got: ${content}`
    );
  });

  test("should return error for relative path when no workspace", async function () {
    // Mock workspace folders to be empty
    const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      value: undefined,
      configurable: true,
    });

    try {
      const relativePath = "some/relative/path.txt";
      const options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters> = {
        input: {
          filePath: relativePath,
        },
        toolInvocationToken: undefined,
      };
      const token = new vscode.CancellationTokenSource().token;

      const result = await tool.invoke(options, token);
      assert.strictEqual(result.content.length, 1);
      assert.ok(
        result.content[0] instanceof vscode.LanguageModelTextPart,
        "Expected text part"
      );
      const content = (result.content[0] as vscode.LanguageModelTextPart).value;
      assert.ok(
        content.includes(
          "Error: No workspace is open to resolve relative path"
        ),
        `Expected workspace error, got: ${content}`
      );
    } finally {
      // Restore original workspace folders
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        value: originalWorkspaceFolders,
        configurable: true,
      });
    }
  });
});
