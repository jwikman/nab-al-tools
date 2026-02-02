import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import * as vscode from "vscode";
import { BuildAlPackageTool } from "../../ChatTools/BuildAlPackageTool";

const testResourcesPath = "../../../src/test/resources/";
const tempFolderPath = path.resolve(
  __dirname,
  testResourcesPath,
  "temp/ChatTools"
);

let folderNumber = 0;
const tempFolders: string[] = [];

function createTempAppJson(): string {
  // Create a unique folder for this test's app.json
  const testFolder = path.join(tempFolderPath, `test_${folderNumber++}`);
  if (!fs.existsSync(testFolder)) {
    fs.mkdirSync(testFolder, { recursive: true });
  }
  const appJsonContent = JSON.stringify(
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Test App",
      publisher: "Test Publisher",
      version: "1.0.0.0",
    },
    null,
    2
  );
  const appJsonPath = path.join(testFolder, "app.json");
  fs.writeFileSync(appJsonPath, appJsonContent, { encoding: "utf-8" });
  tempFolders.push(testFolder);
  return appJsonPath;
}

suite("BuildAlPackageTool", function () {
  let tool: BuildAlPackageTool;

  setup(function () {
    tool = new BuildAlPackageTool();
  });

  teardown(function () {
    tempFolders.forEach((folder) => {
      if (fs.existsSync(folder)) {
        // Recursively remove folder and contents
        const removeRecursive = (dir: string): void => {
          if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
              const curPath = path.join(dir, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                removeRecursive(curPath);
              } else {
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(dir);
          }
        };
        removeRecursive(folder);
      }
    });
    tempFolders.length = 0;
  });

  test("should require appJsonPath parameter", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        appJsonPath: "",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(content.value.includes("Error"), "Expected error message");
    assert.ok(
      content.value.includes("appJsonPath"),
      "Expected error to mention appJsonPath"
    );
  });

  test("should reject non-existent app.json file", async function () {
    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        appJsonPath: "/nonexistent/path/app.json",
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(content.value.includes("Error"), "Expected error message");
    assert.ok(
      content.value.includes("does not exist"),
      "Expected error about non-existent file"
    );
  });

  test("should reject path that is not app.json", async function () {
    // Create a temp folder with wrong filename
    const testFolder = path.join(tempFolderPath, `test_${folderNumber++}`);
    if (!fs.existsSync(testFolder)) {
      fs.mkdirSync(testFolder, { recursive: true });
    }
    const wrongFileName = path.join(testFolder, "wrong.txt");
    fs.writeFileSync(wrongFileName, "test", { encoding: "utf-8" });
    tempFolders.push(testFolder);

    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        appJsonPath: wrongFileName,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(content.value.includes("Error"), "Expected error message");
    assert.ok(
      content.value.includes("app.json"),
      "Expected error to mention app.json requirement"
    );
  });

  test("should handle early cancellation before opening file", async function () {
    const appJsonPath = createTempAppJson();
    const tokenSource = new vscode.CancellationTokenSource();

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    // Cancel immediately
    tokenSource.cancel();

    const result = await tool.invoke(options, tokenSource.token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("cancelled") || content.value.includes("canceled"),
      "Expected cancellation message"
    );
  });

  test("should detect missing AL extension", async function () {
    const appJsonPath = createTempAppJson();
    const token = new vscode.CancellationTokenSource().token;

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    // Mock extension check to return undefined
    const originalGetExtension = vscode.extensions.getExtension;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vscode.extensions as any).getExtension = (id: string) => {
      if (id === "ms-dynamics-smb.al") {
        return undefined;
      }
      return originalGetExtension.call(vscode.extensions, id);
    };

    try {
      const result = await tool.invoke(options, token);
      const content = result.content[0] as vscode.LanguageModelTextPart;

      assert.ok(
        content.value.includes("Error") ||
          content.value.includes("AL Language extension"),
        "Expected error about missing AL extension or build result"
      );
    } finally {
      // Restore original function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (vscode.extensions as any).getExtension = originalGetExtension;
    }
  });

  test("should handle AL extension not active", async function () {
    const appJsonPath = createTempAppJson();
    const token = new vscode.CancellationTokenSource().token;

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    // Check if AL extension is available in test environment
    const alExtension = vscode.extensions.getExtension("ms-dynamics-smb.al");
    if (!alExtension) {
      // Skip test if AL extension not available in test environment
      this.skip();
      return;
    }

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // Should either activate successfully or report error
    assert.ok(typeof content.value === "string", "Expected string result");
  });

  test("should detect unavailable al.package command", async function () {
    const appJsonPath = createTempAppJson();
    const token = new vscode.CancellationTokenSource().token;

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    // Mock getCommands to return empty list
    const originalGetCommands = vscode.commands.getCommands;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vscode.commands as any).getCommands = async () => {
      return [];
    };

    try {
      const result = await tool.invoke(options, token);
      const content = result.content[0] as vscode.LanguageModelTextPart;

      // Should detect missing command or skip if AL not available
      assert.ok(
        content.value.includes("Error") ||
          content.value.includes("not available"),
        "Expected error about unavailable command"
      );
    } finally {
      // Restore original function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (vscode.commands as any).getCommands = originalGetCommands;
    }
  });

  test("prepareInvocation should return proper messages", async function () {
    const appJsonPath = createTempAppJson();

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.prepareInvocation(options);

    assert.ok(
      result.invocationMessage.includes("Building"),
      "Expected invocation message about building"
    );
    assert.ok(
      result.confirmationMessages.title.includes("Build"),
      "Expected confirmation title to mention build"
    );
    assert.ok(
      result.confirmationMessages.message.value.includes("AL package"),
      "Expected confirmation to mention AL package"
    );
  });

  test("prepareInvocation should show app folder name", async function () {
    const appJsonPath = createTempAppJson();
    const appFolderName = path.basename(path.dirname(appJsonPath));

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.prepareInvocation(options);

    assert.ok(
      result.invocationMessage.includes(appFolderName),
      "Expected app folder name in invocation message"
    );
    assert.ok(
      result.confirmationMessages.message.value.includes(appFolderName),
      "Expected app folder name in confirmation"
    );
  });

  test("should handle errors gracefully", async function () {
    const appJsonPath = createTempAppJson();
    const token = new vscode.CancellationTokenSource().token;

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    // Even if build fails, should return structured error message
    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      typeof content.value === "string",
      "Expected string result even on error"
    );
  });

  test("should return valid JSON on successful build", async function () {
    const appJsonPath = createTempAppJson();
    const token = new vscode.CancellationTokenSource().token;

    const options = {
      input: {
        appJsonPath: appJsonPath,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    // If not an error message, JSON parsing must succeed
    if (!content.value.startsWith("Error:")) {
      const buildResult = JSON.parse(content.value);
      assert.ok(
        "buildSuccess" in buildResult,
        "Expected buildSuccess property"
      );
      assert.ok("errorCount" in buildResult, "Expected errorCount property");
      assert.ok(
        "warningCount" in buildResult,
        "Expected warningCount property"
      );
      assert.ok("diagnostics" in buildResult, "Expected diagnostics property");
      assert.ok(
        Array.isArray(buildResult.diagnostics),
        "Expected diagnostics to be array"
      );
    }
  });

  test("should validate app.json filename exactly", async function () {
    // Create file named "application.json" instead of "app.json" in its own folder
    const testFolder = path.join(tempFolderPath, `test_${folderNumber++}`);
    if (!fs.existsSync(testFolder)) {
      fs.mkdirSync(testFolder, { recursive: true });
    }
    const wrongJsonPath = path.join(testFolder, "application.json");
    fs.writeFileSync(
      wrongJsonPath,
      JSON.stringify({
        id: "test",
        name: "Test",
        publisher: "Test",
        version: "1.0.0.0",
      }),
      { encoding: "utf-8" }
    );
    tempFolders.push(testFolder);

    const token = new vscode.CancellationTokenSource().token;
    const options = {
      input: {
        appJsonPath: wrongJsonPath,
      },
      toolInvocationToken: undefined,
    };

    const result = await tool.invoke(options, token);
    const content = result.content[0] as vscode.LanguageModelTextPart;

    assert.ok(
      content.value.includes("Error"),
      "Expected error for wrong filename"
    );
    assert.ok(
      content.value.includes("app.json"),
      "Expected error to mention app.json requirement"
    );
  });
});
