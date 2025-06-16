import * as vscode from "vscode";
import * as fs from "fs";
import * as SettingsLoader from "./Settings/SettingsLoader";
import { TargetState } from "./Xliff/XLIFFDocument";
import { LanguageFunctionsSettings } from "./Settings/LanguageFunctionsSettings";
import { xliffCache } from "./Xliff/XLIFFCache";

export function registerChatTools(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.lm.registerTool("get_untranslatedTexts", new UntranslatedTextsTool())
  );
  context.subscriptions.push(
    vscode.lm.registerTool("get_translatedTexts", new TranslatedTextsTool())
  );
  context.subscriptions.push(
    vscode.lm.registerTool(
      "save_translatedTexts",
      new SaveTranslatedTextsTool()
    )
  );
}

interface IUntranslatedTextsParameters {
  filePath: string;
  batchSize: number;
}

interface IUntranslatedText {
  id: string;
  source: string;
  comment?: string;
}

export class UntranslatedTextsTool
  implements vscode.LanguageModelTool<IUntranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IUntranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.batchSize || 50;

    if (!params.filePath) {
      throw new Error(
        "The File path parameter is required. Please provide an absolute path to a XLF file."
      );
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(
        `The file at path ${params.filePath} does not exist. Please provide a valid file path.`
      );
    }

    const xliffDoc = xliffCache.get(params.filePath);

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
      if (counter > maxCount || _token.isCancellationRequested) {
        return;
      }
      response.push({
        id: tu.id,
        source: tu.source,
        comment: tu.developerNote() ? tu.developerNoteContent() : undefined,
      });
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
      title: "Get Untranslated Texts",
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

interface ITranslatedTextsParameters {
  filePath: string;
  batchSize: number;
}

interface ITranslatedText {
  sourceText: string;
  targetTexts: string[];
}

export class TranslatedTextsTool
  implements vscode.LanguageModelTool<ITranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.batchSize || 500;

    if (!params.filePath) {
      throw new Error(
        "The File path parameter is required. Please provide an absolute path to a XLF file."
      );
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(
        `The file at path ${params.filePath} does not exist. Please provide a valid file path.`
      );
    }

    const xliffDoc = xliffCache.get(params.filePath);

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
      if (counter > maxCount || _token.isCancellationRequested) {
        return;
      }
      response.push({
        sourceText: key,
        targetTexts: item,
      });
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

interface INewTranslatedText {
  id: string;
  sourceText: string;
  targetText: string;
}
interface INewTranslatedTextsParameters {
  filePath: string;
  translations: INewTranslatedText[];
}

export class SaveTranslatedTextsTool
  implements vscode.LanguageModelTool<INewTranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<INewTranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

    if (!params.filePath) {
      throw new Error(
        "The File path parameter is required. Please provide an absolute path to a XLF file."
      );
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(
        `The file at path ${params.filePath} does not exist. Please provide a valid file path.`
      );
    }

    const xliffDoc = xliffCache.get(params.filePath);

    if (!xliffDoc) {
      throw new Error(
        `Failed to load XLIFF document from ${params.filePath}. Please ensure the file is a valid XLIFF file.`
      );
    }

    params.translations.forEach((translation) => {
      const tu = xliffDoc.transunit.find((tu) => tu.id === translation.id);
      if (tu) {
        if (tu.source !== translation.sourceText) {
          throw new Error(
            `Source text mismatch for translation unit with id ${translation.id}. Expected: "${tu.source}", Received: "${translation.sourceText}"`
          );
        }
        tu.target.textContent = translation.targetText;
        if (tu.target.state) {
          tu.target.state = TargetState.translated;
        }
      } else {
        throw new Error(
          `Translation unit with id ${translation.id} not found.`
        );
      }
    });
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );

    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }
    xliffCache.update(
      params.filePath,
      xliffDoc.toString(
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        languageFunctionsSettings.formatXml,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff
      )
    );
    xliffDoc.toFileAsync(
      params.filePath,
      languageFunctionsSettings.replaceSelfClosingXlfTags,
      languageFunctionsSettings.formatXml,
      languageFunctionsSettings.searchReplaceBeforeSaveXliff,
      "UTF8"
    );

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart("Translations saved successfully."),
    ]);
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<INewTranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const confirmationMessages = {
      title: "Save Translated Texts",
      message: new vscode.MarkdownString(
        `Save translations to file **${options.input.filePath}**?`
      ),
    };
    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }

    return {
      invocationMessage: "Saving translated texts...",
      confirmationMessages,
    };
  }
}
