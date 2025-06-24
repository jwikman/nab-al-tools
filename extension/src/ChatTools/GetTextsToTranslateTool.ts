import * as vscode from "vscode";
import * as fs from "fs";
import { Xliff } from "../Xliff/XLIFFDocument";
import * as Telemetry from "../Telemetry/Telemetry";

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
  type: string;
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
        `The file at path ${params.filePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
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
    const untranslatedTexts = xliffDoc.transunit.filter((tu) =>
      tu.needsTranslation()
    );
    const response: IUntranslatedText[] = [];
    untranslatedTexts.forEach((tu) => {
      counter++;
      if (
        (counter - offset > maxCount && maxCount !== 0) ||
        _token.isCancellationRequested
      ) {
        return;
      }
      if (counter > offset) {
        let sourceText = tu.source;
        let currentSourceLanguage = sourceLanguage;
        if (useCustomSourceLanguage) {
          const sourceTu = sourceXliffDoc?.getTransUnitById(tu.id);
          if (sourceTu) {
            sourceText = sourceTu.target.textContent;
          } else {
            currentSourceLanguage = defaultLanguage;
          }
        }
        let maxLength = undefined;
        if (tu.maxwidth) {
          maxLength = tu.maxwidth;
        }
        response.push({
          id: tu.id,
          sourceText: sourceText,
          sourceLanguage: currentSourceLanguage,
          maxLength: maxLength,
          comment: !tu.developerNote()
            ? undefined
            : tu.developerNoteContent() === ""
            ? undefined
            : tu.developerNoteContent(),
          type: tu.xliffGeneratorNoteContent(),
        });
      }
    });
    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }
    Telemetry.trackEvent("GetTextsToTranslateTool", {
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
