import * as vscode from "vscode";
import * as fs from "fs";
import { Xliff } from "../Xliff/XLIFFDocument";

export interface ITranslatedTextsParameters {
  filePath: string;
  offset?: number;
  limit: number;
  sourceLanguageFilePath?: string; // TODO: Implement source language file path
}

export interface ITranslatedText {
  sourceText: string;
  targetTexts: string[];
}

export class GetTranslatedTextsMapTool
  implements vscode.LanguageModelTool<ITranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;

    if (!params.filePath) {
      throw new Error(
        "The File path parameter is required. Please provide an absolute path to a XLF file. The path must be absolute, not relative."
      );
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(
        `The file at path ${params.filePath} does not exist. Please provide a valid file path.`
      );
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
        response.push({
          sourceText: key,
          targetTexts: item,
        });
      }
    });
    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }

    const jsonText = JSON.stringify(response);
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(jsonText),
    ]);
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
    const confirmationMessages = {
      title: "Get Translated Texts",
      message: new vscode.MarkdownString(
        `Get translated texts from file **${options.input.filePath}**?`
      ),
    };
    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }
    return {
      invocationMessage: "Getting translated texts...",
      confirmationMessages,
    };
  }
}
