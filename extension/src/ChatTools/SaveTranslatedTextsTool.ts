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
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<INewTranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

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

    for (const translation of params.translations) {
      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }
      const tu = xliffDoc.transunit.find((tu) => tu.id === translation.id);
      if (tu) {
        tu.target.textContent = translation.targetText;
        if (tu.target.state) {
          switch (translation.targetState) {
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
              tu.target.state = TargetState.translated;
              break;
          }
        }
        if (tu.target.translationToken) {
          tu.target.translationToken = undefined; // Clear the translation token
        }
        tu.removeCustomNote(CustomNoteType.refreshXlfHint);
      } else {
        throw new Error(
          `Translation unit with id ${translation.id} not found.`
        );
      }
    }
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );

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
