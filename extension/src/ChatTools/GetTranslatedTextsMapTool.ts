import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTranslatedTextsMapCore } from "./shared/XliffToolsCore";
import {
  wrapWithLanguageEnvelope,
  resolveOutputFormat,
  objectArrayToTsv,
} from "./shared/OutputFormatUtils";

export interface ITranslatedTextsMapParameters {
  filePath: string;
  offset?: number;
  limit: number;
  sourceLanguageFilePath?: string;
  outputFormat?: string; // "json" | "tsv", default "json"
  sampling?: string; // "even", default undefined (sequential)
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
      const format = resolveOutputFormat(params.outputFormat, "json");

      // Use shared core (no settings needed for this operation)
      const result = getTranslatedTextsMapCore(
        params.filePath,
        offset,
        maxCount,
        params.sourceLanguageFilePath,
        params.sampling
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Use telemetry data from core
      Telemetry.trackEvent("GetTranslatedTextsMapTool", result.telemetry);

      if (format === "tsv") {
        const envelope = wrapWithLanguageEnvelope(
          (result.data as unknown) as Record<string, unknown>[]
        );
        // Flatten: one row per source-target pair
        const flatRows: Record<string, unknown>[] = [];
        for (const item of envelope.items) {
          const targetTexts = item.targetTexts as string[];
          const sourceText = item.sourceText as string;
          for (const targetText of targetTexts) {
            flatRows.push({ sourceText, targetText });
          }
        }
        const headerComment = `# sourceLanguage: ${envelope.sourceLanguage}`;
        const tsv = objectArrayToTsv(flatRows);
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            tsv ? `${headerComment}\n${tsv}` : headerComment
          ),
        ]);
      }

      const envelope = wrapWithLanguageEnvelope(
        (result.data as unknown) as Record<string, unknown>[]
      );
      const jsonText = JSON.stringify(envelope);

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(jsonText),
      ]);
    } catch (error) {
      // For validation errors (file not found), re-throw
      // These are expected to be caught by test harnesses
      // TODO: Refactor tests to handle LanguageModelToolResult instead of throwing
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
