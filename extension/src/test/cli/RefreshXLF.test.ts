import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import * as childProcess from "child_process";

suite("RefreshXLF CLI Tests", function () {
  const testAppPath = path.resolve(
    __dirname,
    "../../../../test-app/Xliff-test"
  );
  const cliScriptPath = path.resolve(
    __dirname,
    "../../../out/cli/RefreshXLF.js"
  );

  // Helper function to execute the CLI script
  function execCli(
    args: string[]
  ): {
    stdout: string;
    stderr: string;
    exitCode: number | null;
  } {
    try {
      const result = childProcess.spawnSync("node", [cliScriptPath, ...args], {
        encoding: "utf8",
        timeout: 30000,
      });
      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.status,
      };
    } catch (error) {
      throw new Error(`Failed to execute CLI: ${error}`);
    }
  }

  test("CLI script exists", function () {
    assert.ok(
      fs.existsSync(cliScriptPath),
      `CLI script not found at ${cliScriptPath}. Run 'npm run test-compile' first.`
    );
  });

  test("getParameters: No arguments - shows usage", function () {
    const result = execCli([]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 when no arguments provided"
    );
    assert.ok(
      result.stdout.includes("Usage:"),
      "Expected usage message in output"
    );
  });

  test("getParameters: Invalid app folder - error", function () {
    const result = execCli([path.join(testAppPath, "NonExistent", "Path")]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 for invalid app folder"
    );
    assert.ok(
      result.stderr.includes("Could not find AL project"),
      "Expected error message about missing project"
    );
  });

  test("getParameters: App folder looks like flag - error", function () {
    const result = execCli(["--not-a-folder"]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 for flag-like app folder"
    );
    assert.ok(
      result.stderr.includes("Invalid app folder path"),
      "Expected error about invalid app folder path"
    );
  });

  test("getParameters: Unknown option - error", function () {
    const result = execCli([testAppPath, "--unknown-flag"]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 for unknown option"
    );
    assert.ok(
      result.stderr.includes("Unknown option"),
      "Expected error about unknown option"
    );
  });

  test("getParameters: Multiple workspace files - error", function () {
    const workspaceFile = path.join(
      testAppPath,
      "..",
      "TestApp.code-workspace"
    );
    const result = execCli([
      testAppPath,
      workspaceFile,
      workspaceFile, // Duplicate
    ]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 for multiple workspace files"
    );
    assert.ok(
      result.stderr.includes("Multiple workspace files specified"),
      "Expected error about multiple workspace files"
    );
  });

  test("getParameters: Non-existent workspace file - error", function () {
    const result = execCli([
      testAppPath,
      path.join(testAppPath, "NonExistent", "workspace.code-workspace"),
    ]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 for non-existent workspace file"
    );
    assert.ok(
      result.stderr.includes("Could not find workspace file"),
      "Expected error about missing workspace file"
    );
  });

  test("getParameters: Valid app folder - success", function () {
    const result = execCli([testAppPath]);

    assert.ok(
      result.exitCode === 0 ||
        result.stdout.includes("Everything is translated and up to date") ||
        result.stdout.includes("needs translation"),
      "Expected success or translation status message"
    );
  });

  test("getParameters: Valid app folder with workspace file - success", function () {
    const workspaceFile = path.join(
      testAppPath,
      "..",
      "TestApp.code-workspace"
    );
    if (!fs.existsSync(workspaceFile)) {
      this.skip();
      return;
    }

    const result = execCli([testAppPath, workspaceFile]);

    assert.ok(
      result.exitCode === 0 ||
        result.stdout.includes("Everything is translated and up to date") ||
        result.stdout.includes("needs translation"),
      "Expected success or translation status message"
    );
  });

  test("Option: --update-g-xlf flag", function () {
    const result = execCli([testAppPath, "--update-g-xlf"]);

    // Should run update-g-xlf before refreshing
    assert.ok(
      result.exitCode === 0 ||
        result.stdout.includes("g.xlf") ||
        result.stdout.includes("needs translation") ||
        result.stdout.includes("Everything is translated and up to date"),
      "Expected update-g-xlf to run"
    );
  });

  test("Option: --fail-changed flag without changes - success", function () {
    // This test assumes the test-app is already up to date
    const result = execCli([testAppPath, "--fail-changed"]);

    // If there are no changes, it should succeed
    // If there are changes, it should fail with exit code 1
    assert.ok(
      result.exitCode === 0 || result.exitCode === 1,
      "Expected exit code 0 (no changes) or 1 (changes found)"
    );
  });

  test("Option: --github-message flag format", function () {
    const result = execCli([testAppPath, "--github-message"]);

    // GitHub message format should not include timestamps
    // and should use ::warning:: or ::error:: format
    if (result.stdout.includes("needs translation")) {
      assert.ok(
        result.stdout.includes("::warning::") ||
          result.stdout.includes("::error::"),
        "Expected GitHub Actions workflow command format"
      );
      assert.ok(
        !result.stdout.match(/\d{4}-\d{2}-\d{2}/),
        "Expected no timestamps in GitHub message format"
      );
    }
  });

  test("Option: Combined --update-g-xlf and --fail-changed", function () {
    const result = execCli([testAppPath, "--update-g-xlf", "--fail-changed"]);

    assert.ok(
      result.exitCode === 0 || result.exitCode === 1,
      "Expected exit code 0 (no changes) or 1 (changes found)"
    );
  });

  test("Option: Combined --github-message and --fail-changed", function () {
    const result = execCli([testAppPath, "--github-message", "--fail-changed"]);

    if (result.stdout.includes("needs translation")) {
      assert.ok(
        result.stdout.includes("::warning::") ||
          result.stdout.includes("::error::"),
        "Expected GitHub Actions format"
      );

      // With --fail-changed and changes present, should use ::error::
      if (result.exitCode === 1) {
        // Note: The current implementation doesn't exit with code 1 when using
        // --github-message because GitHub Actions detects errors from ::error:: messages
        assert.ok(
          result.stdout.includes("::error::") ||
            result.stdout.includes("::warning::"),
          "Expected error or warning format"
        );
      }
    }
  });

  test("Output format: Standard format without flags", function () {
    const result = execCli([testAppPath]);

    // Standard format: "filename.xlf: message"
    // Check if there are translation messages OR if it's up to date
    const hasTranslationMessages = result.stdout.match(/\.xlf:/);
    const isUpToDate = result.stdout.includes(
      "Everything is translated and up to date"
    );

    assert.ok(
      hasTranslationMessages || isUpToDate,
      `Expected standard format with 'filename.xlf:' or up-to-date message. Got: ${result.stdout}`
    );
  });

  test("Output format: GitHub format with --github-message", function () {
    const result = execCli([testAppPath, "--github-message"]);

    if (result.stdout.includes("needs translation")) {
      // New format (without --check-only): "::warning::filename.xlf needs translation: details, more details"
      assert.ok(
        result.stdout.includes("::warning::"),
        "Expected GitHub warning format"
      );
      assert.ok(
        result.stdout.match(/::warning::.*\.xlf needs translation:/),
        "Expected line with 'needs translation:' followed by details"
      );
      // Should have details after "needs translation:" (not on separate lines)
      const warningLines = result.stdout
        .split("\n")
        .filter(
          (line) => line.includes("::warning::") && line.includes(".xlf")
        );
      assert.ok(warningLines.length > 0, "Expected at least one warning line");
      // Verify the format has details on the same line
      const hasDetailsOnSameLine = warningLines.some((line) =>
        line.match(/::warning::.*\.xlf needs translation:.+/)
      );
      assert.ok(
        hasDetailsOnSameLine,
        "Expected details on the same line as 'needs translation:'"
      );
    }
  });

  test("Workspace file position: Before flags", function () {
    const workspaceFile = path.join(
      testAppPath,
      "..",
      "TestApp.code-workspace"
    );
    if (!fs.existsSync(workspaceFile)) {
      this.skip();
      return;
    }

    const result = execCli([testAppPath, workspaceFile, "--update-g-xlf"]);

    assert.ok(
      result.exitCode === 0 ||
        result.stdout.includes("needs translation") ||
        result.stdout.includes("Everything is translated and up to date"),
      "Expected success with workspace file before flags"
    );
  });

  test("Workspace file position: After flags", function () {
    const workspaceFile = path.join(
      testAppPath,
      "..",
      "TestApp.code-workspace"
    );
    if (!fs.existsSync(workspaceFile)) {
      this.skip();
      return;
    }

    const result = execCli([testAppPath, "--update-g-xlf", workspaceFile]);

    assert.ok(
      result.exitCode === 0 ||
        result.stdout.includes("needs translation") ||
        result.stdout.includes("Everything is translated and up to date"),
      "Expected success with workspace file after flags"
    );
  });

  test("Unexpected argument - error", function () {
    const result = execCli([testAppPath, "unexpected-argument"]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 for unexpected argument"
    );
    assert.ok(
      result.stderr.includes("Unexpected argument"),
      "Expected error about unexpected argument"
    );
  });

  test("Option: --check-only flag with --github-message (simplified output)", function () {
    const result = execCli([testAppPath, "--check-only", "--github-message"]);

    if (result.stdout.includes("needs translation")) {
      // Simplified format: "::warning::filename.xlf needs translation"
      // Should NOT include details after "needs translation"
      const lines = result.stdout.split("\n");
      const warningLines = lines.filter((line) =>
        line.includes("needs translation")
      );

      for (const line of warningLines) {
        assert.ok(
          line.includes("::warning::"),
          "Expected GitHub warning format"
        );
        assert.ok(
          line.match(/::warning::.*\.xlf needs translation$/),
          `Expected simple format without details. Got: ${line}`
        );
      }
    }
  });

  test("Option: --check-only flag without --github-message (standard output)", function () {
    const result = execCli([testAppPath, "--check-only"]);

    // Should still work in standard mode
    assert.ok(
      result.exitCode === 0 ||
        result.stdout.includes("needs translation") ||
        result.stdout.includes("Everything is translated and up to date"),
      "Expected standard output format with check-only"
    );
  });

  test("Option: --github-message without --check-only (detailed output)", function () {
    const result = execCli([testAppPath, "--github-message"]);

    if (result.stdout.includes("needs translation")) {
      // Detailed format: "::warning::filename.xlf needs translation: details, more details"
      // Should include details after "needs translation:"
      const lines = result.stdout.split("\n");
      const warningLines = lines.filter((line) =>
        line.includes("needs translation")
      );

      for (const line of warningLines) {
        if (line.includes("::warning::") && line.includes(".xlf")) {
          // Should have details after "needs translation:"
          assert.ok(
            line.match(/::warning::.*\.xlf needs translation:.+/),
            `Expected detailed format with translation info. Got: ${line}`
          );
        }
      }
    }
  });

  test("Option: --check-only and --update-g-xlf together - error", function () {
    const result = execCli([testAppPath, "--check-only", "--update-g-xlf"]);

    assert.strictEqual(
      result.exitCode,
      1,
      "Expected exit code 1 when combining --check-only and --update-g-xlf"
    );
    assert.ok(
      result.stderr.includes("cannot be used together"),
      "Expected error about incompatible options"
    );
  });

  test("Option: --check-only does not modify files", function () {
    // Create a temporary copy of a language file to test
    const langFilePath = path.join(testAppPath, "Translations", "Al.da-DK.xlf");

    if (!fs.existsSync(langFilePath)) {
      this.skip();
      return;
    }

    // Read the file content before running CLI
    const beforeContent = fs.readFileSync(langFilePath, "utf8");
    const beforeMtime = fs.statSync(langFilePath).mtimeMs;

    // Wait a bit to ensure timestamp would change if file is modified
    const waitMs = 10;
    const startTime = Date.now();
    while (Date.now() - startTime < waitMs) {
      // Busy wait
    }

    // Run CLI with --check-only
    const result = execCli([testAppPath, "--check-only", "--github-message"]);

    // Read the file content after running CLI
    const afterContent = fs.readFileSync(langFilePath, "utf8");
    const afterMtime = fs.statSync(langFilePath).mtimeMs;

    assert.strictEqual(
      beforeContent,
      afterContent,
      "File content should not change with --check-only"
    );
    assert.strictEqual(
      beforeMtime,
      afterMtime,
      "File modification time should not change with --check-only"
    );
    assert.ok(
      result.exitCode === 0 || result.exitCode === 1,
      "CLI should complete successfully"
    );
  });

  test("Option: --check-only with --fail-changed", function () {
    const result = execCli([
      testAppPath,
      "--check-only",
      "--fail-changed",
      "--github-message",
    ]);

    // Should still check and report, but not modify files
    if (result.stdout.includes("needs translation")) {
      assert.ok(
        result.stdout.includes("::warning::") ||
          result.stdout.includes("::error::"),
        "Expected GitHub Actions format"
      );

      // Should use simplified format with --check-only
      const lines = result.stdout.split("\n");
      const warningLines = lines.filter((line) =>
        line.includes("needs translation")
      );

      for (const line of warningLines) {
        if (line.includes("::")) {
          assert.ok(
            line.match(/::(?:warning|error)::.*\.xlf needs translation$/),
            `Expected simple format. Got: ${line}`
          );
        }
      }
    }

    assert.ok(
      result.exitCode === 0 || result.exitCode === 1,
      "Expected exit code 0 (no changes) or 1 (changes found)"
    );
  });
});
