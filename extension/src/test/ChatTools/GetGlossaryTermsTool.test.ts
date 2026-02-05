import * as assert from "assert";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { GetGlossaryTermsTool } from "../../ChatTools/GetGlossaryTermsTool";

suite("GetGlossaryTermsTool", function () {
  let tool: GetGlossaryTermsTool;
  let mockExtensionContext: vscode.ExtensionContext;

  setup(function () {
    // Create a mock extension context that points to the test resources
    const extensionUri = vscode.Uri.file(path.resolve(__dirname, "../../../"));
    mockExtensionContext = {
      extensionUri: extensionUri,
    } as vscode.ExtensionContext;

    tool = new GetGlossaryTermsTool(mockExtensionContext);
  });

  test("should return glossary terms for valid language codes", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        sourceLanguageCode: "en-US",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;
    const data = JSON.parse(content.value);

    assert.ok(Array.isArray(data), "Expected data to be an array");
    assert.ok(data.length > 0, "Expected at least one glossary entry");
    assert.ok(data[0].source, "Expected source property");
    assert.ok(data[0].target, "Expected target property");
    assert.ok("description" in data[0], "Expected description property");
  });

  test("should use en-US as default source language", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "da-DK",
        // sourceLanguageCode not specified
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;
    const data = JSON.parse(content.value);

    assert.ok(Array.isArray(data), "Expected data to be an array");
    assert.ok(data.length > 0, "Expected at least one glossary entry");
  });

  test("should reject invalid target language code", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "invalid-XX",
        sourceLanguageCode: "en-US",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Error"),
      "Expected error message for invalid target language"
    );
    assert.ok(
      content.value.includes("targetLanguageCode"),
      "Expected error to mention targetLanguageCode"
    );
  });

  test("should reject invalid source language code", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        sourceLanguageCode: "invalid-YY",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Error"),
      "Expected error message for invalid source language"
    );
    assert.ok(
      content.value.includes("sourceLanguageCode"),
      "Expected error to mention sourceLanguageCode"
    );
  });

  test("should handle cancellation token", async function () {
    const tokenSource = new vscode.CancellationTokenSource();
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        sourceLanguageCode: "en-US",
      },
      toolInvocationToken: undefined,
    };

    // Cancel before invoke
    tokenSource.cancel();

    const result = await tool.invoke(options, tokenSource.token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("cancelled") || content.value.includes("canceled"),
      "Expected cancellation message"
    );
  });

  test("should handle error from core function gracefully", async function () {
    const token = new vscode.CancellationTokenSource().token;

    // Create tool with invalid extension context (missing glossary file)
    const nonExistentPath = path.join(
      os.tmpdir(),
      "nab-al-tools-tests",
      "missing"
    );
    const invalidContext = {
      extensionUri: vscode.Uri.file(nonExistentPath),
    } as vscode.ExtensionContext;
    const invalidTool = new GetGlossaryTermsTool(invalidContext);

    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        sourceLanguageCode: "en-US",
      },
      toolInvocationToken: undefined,
    };

    const result = await invalidTool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Error"),
      "Expected error message when glossary file not found"
    );
  });

  test("prepareInvocation should return proper messages without local glossary", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        sourceLanguageCode: "en-US",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.prepareInvocation(options, token);

    assert.ok(
      result.invocationMessage.includes("Reading glossary"),
      "Expected invocation message about reading glossary"
    );
    assert.ok(
      result.confirmationMessages.title.includes("Glossary"),
      "Expected confirmation title to mention glossary"
    );
    assert.ok(
      result.confirmationMessages.message.value.includes("sv-SE"),
      "Expected confirmation to mention target language"
    );
    assert.ok(
      result.confirmationMessages.message.value.includes("en-US"),
      "Expected confirmation to mention source language"
    );
  });

  test("prepareInvocation should mention local glossary when provided", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "da-DK",
        sourceLanguageCode: "en-US",
        localGlossaryPath: "/path/to/custom.tsv",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.prepareInvocation(options, token);

    assert.ok(
      result.confirmationMessages.message.value.includes("custom.tsv"),
      "Expected confirmation to mention local glossary file"
    );
  });

  test("prepareInvocation should handle cancellation", async function () {
    const tokenSource = new vscode.CancellationTokenSource();
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
      },
      toolInvocationToken: undefined,
    };

    tokenSource.cancel();

    const result = await tool.prepareInvocation(options, tokenSource.token);

    assert.ok(
      result.invocationMessage.includes("cancelled") ||
        result.invocationMessage.includes("canceled"),
      "Expected cancellation in invocation message"
    );
  });

  test("should handle case-insensitive language codes", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "SV-se", // Mixed case
        sourceLanguageCode: "EN-us", // Mixed case
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // Should work since isAllowedLanguageCode is case-insensitive
    const data = JSON.parse(content.value);
    assert.ok(
      Array.isArray(data),
      "Expected data array for case-insensitive codes"
    );
  });
});
