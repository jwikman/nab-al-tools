import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTextsToTranslateCore } from "./shared/XliffToolsCore";

export interface IUntranslatedTextsParameters {
  filePath: string;
  offset?: number;
  limit: number;
  sourceLanguageFilePath?: string;
}

export interface IUntranslatedText {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  comment?: string;
  maxLength?: number;
  context: string;
}

export class GetTextsToTranslateTool
  implements vscode.LanguageModelTool<IUntranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;

    try {
      // Use shared core with VS Code settings
      const result = getTextsToTranslateCore(
        params.filePath,
        offset,
        maxCount,
        params.sourceLanguageFilePath
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Use telemetry data from core
      Telemetry.trackEvent("GetTextsToTranslateTool", result.telemetry);

      const jsonText = JSON.stringify(result.data);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(jsonText),
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
    options: vscode.LanguageModelToolInvocationPrepareOptions<IUntranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const confirmationMessages = {
      title: "Get Untranslated Texts?",
      message: new vscode.MarkdownString(
        `Get untranslated texts from file **${options.input.filePath}**?`
      ),
    };

    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }
    return {
      invocationMessage: "Getting untranslated texts...",
      confirmationMessages,
    };
  }
}
