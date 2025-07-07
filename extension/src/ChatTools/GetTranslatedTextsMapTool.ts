import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTranslatedTextsMapCore } from "./shared/XliffToolsCore";

export interface ITranslatedTextsMapParameters {
  filePath: string;
  offset?: number;
  limit: number;
  sourceLanguageFilePath?: string;
}

export interface ITranslatedText {
  sourceText: string;
  targetTexts: string[];
  sourceLanguage: string;
}

export class GetTranslatedTextsMapTool
  implements vscode.LanguageModelTool<ITranslatedTextsMapParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;

    try {
      // Use shared core (no settings needed for this operation)
      const result = getTranslatedTextsMapCore(
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
      Telemetry.trackEvent("GetTranslatedTextsMapTool", result.telemetry);

      const jsonText = JSON.stringify(result.data);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(jsonText),
      ]);
    } catch (error) {
      // For validation errors (file not found), re-throw
      // These are expected to be caught by test harnesses
      // TODO: Refeactor tests to handle LanguageModelToolResult instead of throwing
      if (error instanceof Error) {
        if (error.message.includes("does not exist")) {
          throw error;
        }
      }

      // For other errors, return as result
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${errorMessage}`),
      ]);
    }
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<ITranslatedTextsMapParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const confirmationMessages = {
      title: "Get Translated Texts Map?",
      message: new vscode.MarkdownString(
        `Get translated texts map from file **${options.input.filePath}**?`
      ),
    };
    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }
    return {
      invocationMessage: "Getting translated texts map...",
      confirmationMessages,
    };
  }
}
