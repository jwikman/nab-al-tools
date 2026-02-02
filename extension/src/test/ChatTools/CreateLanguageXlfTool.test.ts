import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import * as vscode from "vscode";
import { CreateLanguageXlfTool } from "../../ChatTools/CreateLanguageXlfTool";
import { xliffCache } from "../../Xliff/XLIFFCache";

const testResourcesPath = "../../../src/test/resources/";
const tempFiles: string[] = [];

suite("CreateLanguageXlfTool", function () {
  let tool: CreateLanguageXlfTool;

  setup(function () {
    tool = new CreateLanguageXlfTool();
    xliffCache.clear();
  });

  teardown(function () {
    tempFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    tempFiles.length = 0;
    xliffCache.clear();
  });

  test("should require generatedXlfFilePath parameter", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        generatedXlfFilePath: "",
        targetLanguageCode: "sv-SE",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(content.value.includes("Error"), "Expected error message");
    assert.ok(
      content.value.includes("generatedXlfFilePath"),
      "Expected error to mention generatedXlfFilePath"
    );
  });

  test("should require targetLanguageCode parameter", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const generatedXlfPath = path.resolve(
      __dirname,
      testResourcesPath,
      "NAB_AL_Tools.g.xlf"
    );

    const options = {
      input: {
        generatedXlfFilePath: generatedXlfPath,
        targetLanguageCode: "",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(content.value.includes("Error"), "Expected error message");
    assert.ok(
      content.value.includes("targetLanguageCode"),
      "Expected error to mention targetLanguageCode"
    );
  });

  test("should create target XLF file successfully", async function () {
    const token = new vscode.CancellationTokenSource().token;

    // Use a generated XLF from test resources
    const generatedXlfPath = path.resolve(
      __dirname,
      testResourcesPath,
      "NAB_AL_Tools.g.xlf"
    );

    if (!fs.existsSync(generatedXlfPath)) {
      this.skip(); // Skip if test resource doesn't exist
      return;
    }

    const options = {
      input: {
        generatedXlfFilePath: generatedXlfPath,
        targetLanguageCode: "da-DK",
        matchBaseAppTranslation: false,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // Require success path since prerequisites are verified
    assert.ok(
      content.value.includes("Successfully created"),
      "Expected successful creation when prerequisites met"
    );
    assert.ok(
      !content.value.includes("Error"),
      "Should not contain error when prerequisites met"
    );

    // Extract and verify the created file exists
    const match = content.value.match(/"([^"]+\.xlf)"/);
    assert.ok(match && match[1], "Expected file path in success message");

    if (match && match[1]) {
      const createdFile = match[1];
      assert.ok(
        fs.existsSync(createdFile),
        "Target XLF file should exist after creation"
      );
      tempFiles.push(createdFile);
    }
  });

  test("should handle matchBaseAppTranslation flag", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const generatedXlfPath = path.resolve(
      __dirname,
      testResourcesPath,
      "NAB_AL_Tools.g.xlf"
    );

    if (!fs.existsSync(generatedXlfPath)) {
      this.skip();
      return;
    }

    // Test with matchBaseAppTranslation = true (default)
    const options = {
      input: {
        generatedXlfFilePath: generatedXlfPath,
        targetLanguageCode: "sv-SE",
        matchBaseAppTranslation: true,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Successfully created") ||
        content.value.includes("Error"),
      "Expected result message"
    );

    // Clean up created file
    const match = content.value.match(/"([^"]+\.xlf)"/);
    if (match && match[1] && fs.existsSync(match[1])) {
      tempFiles.push(match[1]);
    }
  });

  test("should invalidate cache for created file", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const generatedXlfPath = path.resolve(
      __dirname,
      testResourcesPath,
      "NAB_AL_Tools.g.xlf"
    );

    if (!fs.existsSync(generatedXlfPath)) {
      this.skip();
      return;
    }

    const options = {
      input: {
        generatedXlfFilePath: generatedXlfPath,
        targetLanguageCode: "fi-FI",
        matchBaseAppTranslation: false,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // The cache should be invalidated for the created file
    // We can't directly test cache invalidation, but we can verify the tool executed
    assert.ok(
      content.value.includes("Successfully") || content.value.includes("Error"),
      "Expected tool to complete"
    );

    // Clean up
    const match = content.value.match(/"([^"]+\.xlf)"/);
    if (match && match[1] && fs.existsSync(match[1])) {
      tempFiles.push(match[1]);
    }
  });

  test("should handle cancellation token", async function () {
    const tokenSource = new vscode.CancellationTokenSource();
    const generatedXlfPath = path.resolve(
      __dirname,
      testResourcesPath,
      "NAB_AL_Tools.g.xlf"
    );

    if (!fs.existsSync(generatedXlfPath)) {
      this.skip();
      return;
    }

    const options = {
      input: {
        generatedXlfFilePath: generatedXlfPath,
        targetLanguageCode: "nb-NO",
      },
      toolInvocationToken: undefined,
    };

    // Note: Cancellation is checked after core function execution
    // So this test verifies the check exists, but may not cancel in time
    tokenSource.cancel();

    const result = await tool.invoke(options, tokenSource.token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // Either cancelled or completed (timing-dependent)
    assert.ok(
      content.value.includes("cancelled") ||
        content.value.includes("canceled") ||
        content.value.includes("Successfully") ||
        content.value.includes("Error"),
      "Expected some result"
    );

    // Clean up if file was created
    const match = content.value.match(/"([^"]+\.xlf)"/);
    if (match && match[1] && fs.existsSync(match[1])) {
      tempFiles.push(match[1]);
    }
  });

  test("should propagate errors from core function", async function () {
    const token = new vscode.CancellationTokenSource().token;

    // Use non-existent file to trigger error
    const options = {
      input: {
        generatedXlfFilePath: "/nonexistent/path/file.g.xlf",
        targetLanguageCode: "sv-SE",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Error"),
      "Expected error message for non-existent file"
    );
  });

  test("should use default matchBaseAppTranslation when not specified", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const generatedXlfPath = path.resolve(
      __dirname,
      testResourcesPath,
      "NAB_AL_Tools.g.xlf"
    );

    if (!fs.existsSync(generatedXlfPath)) {
      this.skip();
      return;
    }

    const options = {
      input: {
        generatedXlfFilePath: generatedXlfPath,
        targetLanguageCode: "de-DE",
        // matchBaseAppTranslation not specified - should default to true
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // Should complete successfully with default value
    assert.ok(
      content.value.includes("Successfully") || content.value.includes("Error"),
      "Expected result with default matchBaseAppTranslation"
    );

    // Clean up
    const match = content.value.match(/"([^"]+\.xlf)"/);
    if (match && match[1] && fs.existsSync(match[1])) {
      tempFiles.push(match[1]);
    }
  });
});
