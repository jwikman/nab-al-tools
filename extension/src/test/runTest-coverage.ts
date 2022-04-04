import * as path from "path";

import { runTests } from "@vscode/test-electron";

// Ref: https://github.com/microsoft/vscode-test

async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(
      __dirname,
      "./suite/index-coverage"
    );
    const testWorkspace = path.resolve(
      __dirname,
      "../../../test-app/TestApp.code-workspace"
    );
    // Download VS Code, unzip it and run the integration test
    await runTests({
      version: "insiders",
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspace,
        "--skip-welcome",
        "--skip-release-notes",
        "--disable-workspace-trust",
      ],
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
