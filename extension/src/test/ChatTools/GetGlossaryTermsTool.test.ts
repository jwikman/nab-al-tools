import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
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
    const lines = content.value.split("\n");

    assert.strictEqual(
      lines[0],
      "source\ttarget\tdescription",
      "Expected TSV header row"
    );
    assert.ok(lines.length > 1, "Expected at least one glossary entry");
    const fields = lines[1].split("\t");
    assert.strictEqual(fields.length, 3, "Expected 3 columns per row");
    assert.ok(fields[0], "Expected source value");
    assert.ok(fields[1], "Expected target value");
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
    const lines = content.value.split("\n");

    assert.strictEqual(
      lines[0],
      "source\ttarget\tdescription",
      "Expected TSV header row"
    );
    assert.ok(lines.length > 1, "Expected at least one glossary entry");
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
    const lines = content.value.split("\n");
    assert.strictEqual(
      lines[0],
      "source\ttarget\tdescription",
      "Expected TSV header row for case-insensitive codes"
    );
    assert.ok(
      lines.length > 1,
      "Expected data rows for case-insensitive codes"
    );
  });

  test("should return JSON when outputFormat is 'json'", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        sourceLanguageCode: "en-US",
        outputFormat: "json",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    const parsed = JSON.parse(content.value);
    assert.ok(Array.isArray(parsed), "Expected JSON array");
    assert.ok(parsed.length > 0, "Expected at least one glossary entry");
    assert.ok("source" in parsed[0], "Expected source property");
    assert.ok("target" in parsed[0], "Expected target property");
    assert.ok("description" in parsed[0], "Expected description property");
  });

  test("should return TSV by default", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    const lines = content.value.split("\n");
    assert.strictEqual(
      lines[0],
      "source\ttarget\tdescription",
      "Expected TSV header row by default"
    );
  });

  test("should return error for invalid outputFormat", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        outputFormat: "xml",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Error"),
      "Expected error message for invalid outputFormat"
    );
    assert.ok(
      content.value.includes("xml"),
      "Expected error to mention the invalid format"
    );
  });

  test("returnAsFile should write TSV to file and return path", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const storageDir = path.join(
      os.tmpdir(),
      "nab-al-tools-tests",
      "storageUri"
    );
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    const extensionUri = vscode.Uri.file(path.resolve(__dirname, "../../../"));
    const contextWithStorage = {
      extensionUri: extensionUri,
      storageUri: vscode.Uri.file(storageDir),
    } as vscode.ExtensionContext;
    const fileTool = new GetGlossaryTermsTool(contextWithStorage);

    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        returnAsFile: true,
      },
      toolInvocationToken: undefined,
    };

    const result = await fileTool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.startsWith("Result written to file:"),
      "Expected file path message"
    );
    const filePath = content.value.replace("Result written to file: ", "");
    assert.ok(
      filePath.endsWith("glossary-sv-SE.tsv"),
      "Expected deterministic file name"
    );
    assert.ok(fs.existsSync(filePath), "Expected file to exist on disk");

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");
    assert.strictEqual(
      lines[0],
      "source\ttarget\tdescription",
      "Expected TSV header in file"
    );

    // Cleanup
    fs.unlinkSync(filePath);
  });

  test("returnAsFile should write JSON to file when outputFormat is json", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const storageDir = path.join(
      os.tmpdir(),
      "nab-al-tools-tests",
      "storageUri"
    );
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    const extensionUri = vscode.Uri.file(path.resolve(__dirname, "../../../"));
    const contextWithStorage = {
      extensionUri: extensionUri,
      storageUri: vscode.Uri.file(storageDir),
    } as vscode.ExtensionContext;
    const fileTool = new GetGlossaryTermsTool(contextWithStorage);

    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        outputFormat: "json",
        returnAsFile: true,
      },
      toolInvocationToken: undefined,
    };

    const result = await fileTool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.startsWith("Result written to file:"),
      "Expected file path message"
    );
    const filePath = content.value.replace("Result written to file: ", "");
    assert.ok(
      filePath.endsWith("glossary-sv-SE.json"),
      "Expected .json extension"
    );
    assert.ok(fs.existsSync(filePath), "Expected file to exist on disk");

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    assert.ok(Array.isArray(parsed), "Expected JSON array in file");

    // Cleanup
    fs.unlinkSync(filePath);
  });

  test("returnAsFile false should return inline content", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        returnAsFile: false,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    const lines = content.value.split("\n");
    assert.strictEqual(
      lines[0],
      "source\ttarget\tdescription",
      "Expected inline TSV content when returnAsFile is false"
    );
  });

  test("returnAsFile should fall back to inline when storageUri is undefined", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const extensionUri = vscode.Uri.file(path.resolve(__dirname, "../../../"));
    const contextWithoutStorage = {
      extensionUri: extensionUri,
      // storageUri intentionally omitted
    } as vscode.ExtensionContext;
    const noStorageTool = new GetGlossaryTermsTool(contextWithoutStorage);

    const options = {
      input: {
        targetLanguageCode: "sv-SE",
        returnAsFile: true,
      },
      toolInvocationToken: undefined,
    };

    const result = await noStorageTool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Warning: storageUri is not available"),
      "Expected fallback warning"
    );
    assert.ok(
      content.value.includes("source\ttarget\tdescription"),
      "Expected inline content after warning"
    );
  });
});
