import * as vscode from "vscode";
import * as path from "path";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Telemetry from "../Telemetry/Telemetry";
import { refreshXlfFromGXlfCore } from "./shared/XliffToolsCore";
import { xliffCache } from "../Xliff/XLIFFCache";

export interface IRefreshXlfParameters {
  generatedXlfFilePath: string;
  filePath: string;
}

export class RefreshXlfTool
  implements vscode.LanguageModelTool<IRefreshXlfParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IRefreshXlfParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

    try {
      // Get VS Code settings
      const settings = SettingsLoader.getSettings();

      // Use shared core with VS Code settings
      const result = await refreshXlfFromGXlfCore(
        params.generatedXlfFilePath,
        params.filePath,
        settings
      );

      // Clear the cache for this file so hover text shows updated translations
      xliffCache.delete(params.filePath);

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Use telemetry data from core
      Telemetry.trackEvent("RefreshXlfTool", result.telemetry);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(result.data),
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
    options: vscode.LanguageModelToolInvocationPrepareOptions<IRefreshXlfParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const confirmationMessages = {
      title: "Refresh XLF File?",
      message: new vscode.MarkdownString(
        `Update **${path.basename(
          options.input.filePath
        )}** from **${path.basename(options.input.generatedXlfFilePath)}**?`
      ),
    };
    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }

    return {
      invocationMessage: "Refreshing XLF File...",
      confirmationMessages,
    };
  }
}
