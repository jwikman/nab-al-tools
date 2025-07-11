import * as vscode from "vscode";
import * as fs from "fs";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { CustomNoteType, TargetState, Xliff } from "../Xliff/XLIFFDocument";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import * as Telemetry from "../Telemetry/Telemetry";

export interface INewTranslatedText {
  id: string;
  targetText: string;
  targetState?: string;
}
export interface INewTranslatedTextsParameters {
  filePath: string;
  translations: INewTranslatedText[];
}

export class SaveTranslatedTextsTool
  implements vscode.LanguageModelTool<INewTranslatedTextsParameters> {
  // _languageFunctionsSettings is only used for testing purposes:
  _languageFunctionsSettings?: LanguageFunctionsSettings;
  set languageFunctionsSettings(
    languageFunctionSettings: LanguageFunctionsSettings
  ) {
    this._languageFunctionsSettings = languageFunctionSettings;
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<INewTranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

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

    const xliffDoc = Xliff.fromFileSync(params.filePath);

    if (!xliffDoc) {
      throw new Error(
        `Failed to load XLIFF document from ${params.filePath}. Please ensure the file is a valid XLIFF file.`
      );
    }
    let languageFunctionsSettings = this._languageFunctionsSettings;
    if (!languageFunctionsSettings) {
      languageFunctionsSettings = new LanguageFunctionsSettings(
        SettingsLoader.getSettings()
      );
    }
    let translatedCount = 0;
    for (const translation of params.translations) {
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }
      const tu = xliffDoc.transunit.find((tu) => tu.id === translation.id);
      if (tu) {
        tu.target.textContent = translation.targetText;
        translatedCount++;
        if (languageFunctionsSettings.useTargetStates) {
          switch (translation.targetState) {
            case undefined:
              tu.target.state = TargetState.translated;
              break;
            case "needs-review-translation":
              tu.target.state = TargetState.needsReviewTranslation;
              break;
            case "translated":
              tu.target.state = TargetState.translated;
              break;
            case "final":
              tu.target.state = TargetState.final;
              break;
            case "signed-off":
              tu.target.state = TargetState.signedOff;
              break;
            default:
              throw new Error(
                `Invalid target state: ${translation.targetState}. Valid states are: needs-review-translation, translated, final, signed-off.`
              );
          }
        } else {
          tu.target.translationToken = undefined; // Clear the translation token
        }
        tu.removeCustomNote(CustomNoteType.refreshXlfHint);
      } else {
        throw new Error(
          `Translation unit with id ${translation.id} not found.`
        );
      }
    }

    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }
    xliffDoc.toFileSync(
      params.filePath,
      languageFunctionsSettings.replaceSelfClosingXlfTags,
      languageFunctionsSettings.formatXml,
      languageFunctionsSettings.searchReplaceBeforeSaveXliff,
      "UTF8"
    );

    Telemetry.trackEvent("SaveTranslatedTextsTool", {
      targetLanguage: xliffDoc.targetLanguage,
      savedCount: params.translations.length,
    });
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(
        `${translatedCount} ${pluralize(
          "translation",
          translatedCount
        )} saved successfully.`
      ),
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
function pluralize(text: string, translatedCount: number): string {
  if (translatedCount === 1) {
    return text;
  }
  return `${text}s`; // Simple pluralization, can be improved for more complex cases
}
