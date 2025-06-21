import * as vscode from "vscode";
import * as fs from "fs";
import { Xliff } from "../Xliff/XLIFFDocument";
import * as Telemetry from "../Telemetry/Telemetry";

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
    const useCustomSourceLanguage = params.sourceLanguageFilePath
      ? params.sourceLanguageFilePath !== ""
      : false;
    const defaultLanguage = "en-US";
    let sourceLanguage = defaultLanguage;

    if (!params.filePath) {
      throw new Error(
        "The File path parameter is required. Please provide an absolute path to an XLF file. The path must be absolute, not relative."
      );
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(
        `The file at path ${params.filePath} does not exist. Please provide a valid file path.`
      );
    }
    let sourceXliffDoc: Xliff | undefined;
    if (useCustomSourceLanguage) {
      const sourceLanguageFilePath = params.sourceLanguageFilePath || "";

      if (!fs.existsSync(sourceLanguageFilePath)) {
        throw new Error(
          `The source language file at path ${sourceLanguageFilePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
        );
      }
      sourceXliffDoc = Xliff.fromFileSync(sourceLanguageFilePath);
      sourceLanguage = sourceXliffDoc.targetLanguage;
    }

    const xliffDoc = Xliff.fromFileSync(params.filePath);

    if (!xliffDoc) {
      throw new Error(
        `Failed to load XLIFF document from ${params.filePath}. Please ensure the file is a valid XLIFF file.`
      );
    }

    let counter = 0;
    const map = xliffDoc.translationMap();
    const response: ITranslatedText[] = [];
    map.forEach((item, key) => {
      counter++;
      if (
        (counter - offset > maxCount && maxCount !== 0) ||
        _token.isCancellationRequested
      ) {
        return;
      }
      if (counter > offset) {
        let sourceText = key;
        let currentSourceLanguage = sourceLanguage;
        if (useCustomSourceLanguage) {
          const sourceTu = sourceXliffDoc?.getTransUnitsBySource(key)[0];
          if (sourceTu) {
            sourceText = sourceTu.target.textContent;
          } else {
            currentSourceLanguage = defaultLanguage;
          }
        }
        response.push({
          sourceText: sourceText,
          targetTexts: item,
          sourceLanguage: currentSourceLanguage,
        });
      }
    });
    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }
    Telemetry.trackEvent("GetTranslatedTextsMapTool", {
      sourceLanguage: sourceLanguage,
      targetLanguage: xliffDoc.targetLanguage,
      offset: offset,
      limit: maxCount,
      resultCount: response.length,
    });
    const jsonText = JSON.stringify(response);
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(jsonText),
    ]);
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
