import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTranslatedTextsMapCore } from "./shared/XliffToolsCore";
import {
  wrapWithLanguageEnvelope,
  resolveOutputFormat,
} from "./shared/OutputFormatUtils";

export interface ITranslatedTextsMapParameters {
  filePath: string;
  offset?: number;
  limit: number;
  sourceLanguageFilePath?: string;
  outputFormat?: string; // "json" | "tsv", default "json"
  returnAsFile?: boolean; // when true, write result to file and return path
}

export interface ITranslatedText {
  sourceText: string;
  targetTexts: string[];
  sourceLanguage: string;
}

export class GetTranslatedTextsMapTool
  implements vscode.LanguageModelTool<ITranslatedTextsMapParameters> {
  constructor(private readonly extensionContext?: vscode.ExtensionContext) {}
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsMapParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;

    try {
      const format = resolveOutputFormat(params.outputFormat, "json");
      if (format === "tsv") {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            'Error: TSV output is not supported for getTranslatedTextsMap because it contains nested arrays (targetTexts[]). Use outputFormat "json" instead.'
          ),
        ]);
      }

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

      const envelope = wrapWithLanguageEnvelope(
        (result.data as unknown) as Record<string, unknown>[]
      );
      const jsonText = JSON.stringify(envelope);

      if (params.returnAsFile) {
        if (!this.extensionContext?.storageUri) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(
              "Warning: storageUri is not available. Returning inline content instead.\n" +
                jsonText
            ),
          ]);
        }
        // Files in storageUri persist for session; overwritten on repeat calls
        const fileName = `translated-texts-map.json`;
        const fileUri = vscode.Uri.joinPath(
          this.extensionContext.storageUri,
          fileName
        );
        await vscode.workspace.fs.writeFile(
          fileUri,
          Buffer.from(jsonText, "utf-8")
        );
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Result written to file: ${fileUri.fsPath}`
          ),
        ]);
      }

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
