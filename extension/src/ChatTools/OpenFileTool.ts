import * as vscode from "vscode";
import * as path from "path";
import * as fs from "graceful-fs";
import * as Telemetry from "../Telemetry/Telemetry";

export interface IOpenFileParameters {
  /**
   * The absolute or relative path to the file to open and focus
   */
  filePath: string;
  /**
   * Optional line number to navigate to (1-based)
   */
  line?: number;
  /**
   * Optional column number to navigate to (1-based)
   */
  column?: number;
}

export class OpenFileTool
  implements vscode.LanguageModelTool<IOpenFileParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IOpenFileParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

    try {
      // Validate required parameters
      if (!params.filePath) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: filePath parameter is required."
          ),
        ]);
      }

      // Handle relative paths by resolving them against workspace folders
      let absolutePath = params.filePath;
      if (!path.isAbsolute(params.filePath)) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(
              "Error: No workspace is open to resolve relative path."
            ),
          ]);
        }
        absolutePath = path.resolve(
          workspaceFolders[0].uri.fsPath,
          params.filePath
        );
      }

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Error: File does not exist: "${absolutePath}"`
          ),
        ]);
      }

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Convert to URI
      const fileUri = vscode.Uri.file(absolutePath);

      // Check if the file is already open in a visible editor
      const isOpenInEditor = vscode.window.visibleTextEditors.some(
        (editor) => editor.document.uri.toString() === fileUri.toString()
      );

      // Open the document (this will reuse existing document if already loaded)
      const document = await vscode.workspace.openTextDocument(fileUri);

      // Show the document in editor (this will focus it if already open)
      const editor = await vscode.window.showTextDocument(document, {
        preserveFocus: false,
        preview: false,
      });

      // Navigate to specific position if specified
      if (params.line !== undefined) {
        const line = Math.max(0, params.line - 1); // Convert to 0-based
        const column = params.column ? Math.max(0, params.column - 1) : 0;
        const position = new vscode.Position(line, column);

        // Set cursor position
        editor.selection = new vscode.Selection(position, position);

        // Reveal the position
        editor.revealRange(
          editor.selection,
          vscode.TextEditorRevealType.InCenterIfOutsideViewport
        );
      }

      // Track telemetry
      Telemetry.trackEvent("OpenFileTool", {
        hasLineNumber: params.line !== undefined,
        hasColumn: params.column !== undefined,
        wasAlreadyOpen: isOpenInEditor,
      });

      const resultMessage = isOpenInEditor
        ? `Focused on already open file: "${absolutePath}"`
        : `Successfully opened and focused file: "${absolutePath}"`;

      const positionInfo = params.line
        ? ` at line ${params.line}${
            params.column ? `, column ${params.column}` : ""
          }`
        : "";

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(resultMessage + positionInfo),
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${errorMessage}`),
      ]);
    }
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IOpenFileParameters>
    // _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const params = options.input;
    const positionText = params.line
      ? ` at line ${params.line}${
          params.column ? `, column ${params.column}` : ""
        }`
      : "";

    return {
      invocationMessage: `Opening file "${params.filePath}"${positionText}`,
      confirmationMessages: {
        title: "Open File",
        message: new vscode.MarkdownString(
          `Do you want to open and focus the file **${params.filePath}**${positionText}?`
        ),
      },
    };
  }
}
