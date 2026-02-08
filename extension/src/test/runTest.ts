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
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");
    const testWorkspace = path.resolve(
      __dirname,
      "../../../test-app/TestApp.code-workspace"
    );
    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspace,
        "--disable-extensions",
        "--skip-welcome",
        "--skip-release-notes",
        "--disable-workspace-trust",
        "--disable-telemetry",
        "--disable-updates",
        "--disable-crash-reporter",
      ],
    });
  } catch {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
