import * as vscode from "vscode";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Telemetry from "../Telemetry/Telemetry";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import { saveTranslatedTextsCore } from "./shared/XliffToolsCore";

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

    try {
      // Get VS Code settings
      const settings = SettingsLoader.getSettings();

      // Use shared core with settings
      const result = saveTranslatedTextsCore(
        params.filePath,
        params.translations,
        settings,
        this._languageFunctionsSettings
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Use telemetry data from core
      Telemetry.trackEvent("SaveTranslatedTextsTool", result.telemetry);

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(result.data),
      ]);
    } catch (error) {
      // For validation errors (file not found, invalid ID), re-throw
      // These are expected to be caught by test harnesses
      // TODO: Refeactor tests to handle LanguageModelToolResult instead of throwing
      if (error instanceof Error) {
        if (
          error.message.includes("does not exist") ||
          error.message.includes("not found")
        ) {
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
