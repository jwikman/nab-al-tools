import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as Telemetry from "../Telemetry/Telemetry";

export interface IBuildAlPackageParameters {
  /**
   * The absolute path to the app.json file of the AL project to build
   */
  appJsonPath: string;
}

interface DiagnosticDetail {
  filePath: string;
  line: number;
  column: number;
  severity: string;
  code: string;
  message: string;
  sourceContext: string;
  isMainApp: boolean;
}

interface BuildResult {
  buildSuccess: boolean;
  errorCount: number;
  warningCount: number;
  diagnostics: DiagnosticDetail[];
}

export class BuildAlPackageTool
  implements vscode.LanguageModelTool<IBuildAlPackageParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IBuildAlPackageParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

    try {
      // Check cancellation early
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Validate required parameters
      if (!params.appJsonPath) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: appJsonPath parameter is required."
          ),
        ]);
      }

      // Validate app.json exists
      if (!fs.existsSync(params.appJsonPath)) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error: app.json file does not exist: "${params.appJsonPath}"`
          ),
        ]);
      }

      // Validate it's actually an app.json file
      if (path.basename(params.appJsonPath).toLowerCase() !== "app.json") {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error: The specified path must point to an app.json file. Got: "${path.basename(
              params.appJsonPath
            )}"`
          ),
        ]);
      }

      // Check cancellation before opening file
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Open and focus the app.json file (required by AL extension)
      const fileUri = vscode.Uri.file(params.appJsonPath);
      const document = await vscode.workspace.openTextDocument(fileUri);

      // Check cancellation after opening document
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      await vscode.window.showTextDocument(document, {
        preserveFocus: false,
        preview: false,
      });

      // Check cancellation before building
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Check if AL extension is available and activated
      const alExtension = vscode.extensions.getExtension("ms-dynamics-smb.al");
      if (!alExtension) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: AL Language extension (ms-dynamics-smb.al) is not installed. Please install the AL Language extension to use this tool."
          ),
        ]);
      }

      if (!alExtension.isActive) {
        try {
          await alExtension.activate();
        } catch (error) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(
              `Error: Failed to activate AL Language extension: ${
                error instanceof Error ? error.message : String(error)
              }`
            ),
          ]);
        }
      }

      // Verify al.package command is available
      const allCommands = await vscode.commands.getCommands(true);
      if (!allCommands.includes("al.package")) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: al.package command is not available. The AL Language extension may not be properly initialized. Try opening an AL file first."
          ),
        ]);
      }

      // Execute al.package command
      await vscode.commands.executeCommand("al.package");

      // Check cancellation after build
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Wait a bit for diagnostics to be published by the AL extension
      // The AL extension publishes diagnostics asynchronously after compilation
      // Since this is called from LLM, 2s is ok - better to get the correct info
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check cancellation after waiting
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Gather all diagnostics
      const allDiagnostics = vscode.languages.getDiagnostics();

      // Filter for AL files and app.json files
      const alDiagnostics = allDiagnostics.filter(
        ([uri]) =>
          uri.fsPath.endsWith(".al") ||
          path.basename(uri.fsPath).toLowerCase() === "app.json"
      );

      // Get the app folder (parent of app.json)
      const appFolder = path.dirname(params.appJsonPath);

      const diagnostics: DiagnosticDetail[] = [];
      let errorCount = 0;
      let warningCount = 0;

      // Process all diagnostics (including dependencies)
      for (const [uri, fileDiagnostics] of alDiagnostics) {
        const filePath = uri.fsPath;
        const isMainApp = filePath.startsWith(appFolder);

        for (const diagnostic of fileDiagnostics) {
          // Count and include errors and warnings
          if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
            errorCount++;
          } else if (
            diagnostic.severity === vscode.DiagnosticSeverity.Warning
          ) {
            warningCount++;
          } else {
            continue; // Skip info and hints
          }

          // Get source code context (±5 lines)
          const sourceContext = await this.getSourceContext(
            filePath,
            diagnostic.range.start.line,
            5
          );

          diagnostics.push({
            filePath: filePath,
            line: diagnostic.range.start.line + 1, // Convert to 1-based
            column: diagnostic.range.start.character + 1, // Convert to 1-based
            severity: this.getSeverityString(diagnostic.severity),
            code: diagnostic.code?.toString() || "",
            message: diagnostic.message,
            sourceContext: sourceContext,
            isMainApp: isMainApp,
          });
        }
      }

      const buildResult: BuildResult = {
        buildSuccess: errorCount === 0,
        errorCount: errorCount,
        warningCount: warningCount,
        diagnostics: diagnostics,
      };

      // Track telemetry
      Telemetry.trackEvent("BuildAlPackageTool", {
        success: buildResult.buildSuccess,
        errorCount: errorCount,
        warningCount: warningCount,
        appPath: path.dirname(params.appJsonPath),
      });

      // Return result as JSON
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(JSON.stringify(buildResult, null, 2)),
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Telemetry.trackEvent("BuildAlPackageTool", {
        success: false,
        error: errorMessage,
      });
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${errorMessage}`),
      ]);
    }
  }

  /**
   * Gets source code context around an error line
   * @param filePath Path to the source file
   * @param errorLine The line number (0-based) where the error occurred
   * @param contextLines Number of lines to include before and after the error
   * @returns Formatted string with line numbers and source code
   */
  private async getSourceContext(
    filePath: string,
    errorLine: number,
    contextLines: number
  ): Promise<string> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const totalLines = document.lineCount;

      const startLine = Math.max(0, errorLine - contextLines);
      const endLine = Math.min(totalLines - 1, errorLine + contextLines);

      const lines: string[] = [];
      for (let i = startLine; i <= endLine; i++) {
        const lineText = document.lineAt(i).text;
        const lineNumber = i + 1; // Convert to 1-based
        const marker = i === errorLine ? ">>> " : "    ";
        lines.push(`${marker}${lineNumber}: ${lineText}`);
      }

      return lines.join("\n");
    } catch (error) {
      return `Unable to read source file: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  /**
   * Converts VS Code diagnostic severity to string
   */
  private getSeverityString(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return "Error";
      case vscode.DiagnosticSeverity.Warning:
        return "Warning";
      case vscode.DiagnosticSeverity.Information:
        return "Information";
      case vscode.DiagnosticSeverity.Hint:
        return "Hint";
      default:
        return "Unknown";
    }
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IBuildAlPackageParameters>
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const params = options.input;
    const appName = path.basename(path.dirname(params.appJsonPath));

    return {
      invocationMessage: `Building AL package for "${appName}"...`,
      confirmationMessages: {
        title: "Build AL Package",
        message: new vscode.MarkdownString(
          `Do you want to build the AL package for **${appName}**?\n\nThis will compile the project and return detailed error information if the build fails.`
        ),
      },
    };
  }
}
