import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getTextsToTranslateCore } from "./shared/XliffToolsCore";
import {
  resolveOutputFormat,
  objectArrayToTsv,
} from "./shared/OutputFormatUtils";

export interface IUntranslatedTextsParameters {
  filePath: string;
  offset?: number;
  limit: number;
  sourceLanguageFilePath?: string;
  outputFormat?: string; // "json" | "tsv", default "json"
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

      // Hoist sourceLanguage from texts to envelope level
      const sourceLanguage =
        result.data.texts.length > 0 ? result.data.texts[0].sourceLanguage : "";
      const strippedTexts = result.data.texts.map((text) =>
        Object.fromEntries(
          Object.entries(text).filter(([key]) => key !== "sourceLanguage")
        )
      );

      const format = resolveOutputFormat(params.outputFormat, "json");
      let output: string;
      if (format === "tsv") {
        const header = `# sourceLanguage: ${sourceLanguage}\n# totalUntranslatedCount: ${result.data.totalUntranslatedCount}\n# returnedCount: ${result.data.returnedCount}`;
        const tsv = objectArrayToTsv(
          strippedTexts as Record<string, unknown>[]
        );
        output = tsv ? `${header}\n${tsv}` : header;
      } else {
        const envelope = {
          sourceLanguage,
          totalUntranslatedCount: result.data.totalUntranslatedCount,
          returnedCount: result.data.returnedCount,
          texts: strippedTexts,
        };
        output = JSON.stringify(envelope);
      }
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(output),
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
