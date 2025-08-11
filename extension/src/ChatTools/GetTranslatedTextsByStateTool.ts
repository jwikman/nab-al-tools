import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTranslatedTextsByStateCore } from "./shared/XliffToolsCore";

export interface ITranslatedTextsParameters {
  filePath: string;
  offset?: number;
  limit: number;
  translationStateFilter?: string;
  sourceText?: string;
  sourceLanguageFilePath?: string;
}

export interface ITranslatedText {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  targetText: string;
  comment?: string;
  translationState?: string;
  reviewReason?: string;
  maxLength?: number;
  type: string;
}

export class GetTranslatedTextsByStateTool
  implements vscode.LanguageModelTool<ITranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;

    try {
      // Use shared core (no settings needed for this operation)
      const result = getTranslatedTextsByStateCore(
        params.filePath,
        offset,
        maxCount,
        params.translationStateFilter,
        params.sourceText,
        params.sourceLanguageFilePath
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Use telemetry data from core
      Telemetry.trackEvent("GetTranslatedTextsByStateTool", result.telemetry);

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
    options: vscode.LanguageModelToolInvocationPrepareOptions<ITranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const stateFilter = options.input.translationStateFilter
      ? ` with state '${options.input.translationStateFilter}'`
      : "";

    const confirmationMessages = {
      title: "Get Translated Texts by State?",
      message: new vscode.MarkdownString(
        `Get translated texts${stateFilter} from file **${options.input.filePath}**?`
      ),
    };

    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }
    return {
      invocationMessage: "Getting translated texts by state...",
      confirmationMessages,
    };
  }
}
