import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTextsByKeywordCore } from "./shared/XliffToolsCore";

export interface IGetTextsByKeywordParameters {
  filePath: string;
  offset?: number;
  limit: number;
  keyword: string;
  caseSensitive?: boolean;
  isRegex?: boolean;
  searchInTarget?: boolean;
}

export class GetTextsByKeywordTool
  implements vscode.LanguageModelTool<IGetTextsByKeywordParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IGetTextsByKeywordParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;
    try {
      const result = getTextsByKeywordCore(
        params.filePath,
        offset,
        maxCount,
        params.keyword,
        params.caseSensitive || false,
        params.isRegex || false,
        params.searchInTarget || false
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      Telemetry.trackEvent("GetTextsByKeywordTool", result.telemetry);

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
    options: vscode.LanguageModelToolInvocationPrepareOptions<IGetTextsByKeywordParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const confirmationMessages = {
      title: "Get Texts by Keyword?",
      message: new vscode.MarkdownString(
        `Find texts containing **${options.input.keyword}** in file **${options.input.filePath}**?`
      ),
    };

    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }
    return {
      invocationMessage: "Searching texts by keyword...",
      confirmationMessages,
    };
  }
}
