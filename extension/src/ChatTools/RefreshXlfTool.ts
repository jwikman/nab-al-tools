import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as XliffFunctions from "../XliffFunctions";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import * as Telemetry from "../Telemetry/Telemetry";

export interface IRefreshXlfParameters {
  generatedXlfFilePath: string;
  filePath: string;
}

export class RefreshXlfTool
  implements vscode.LanguageModelTool<IRefreshXlfParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IRefreshXlfParameters>,
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
    if (!params.generatedXlfFilePath) {
      throw new Error(
        "The Generated XLF file path parameter is required. Please provide an absolute path to a generated XLF file."
      );
    }
    if (!fs.existsSync(params.generatedXlfFilePath)) {
      throw new Error(
        `The generated XLF file at path ${params.generatedXlfFilePath} does not exist. Please provide a valid file path.`
      );
    }

    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );

    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }
    const result = await XliffFunctions._refreshXlfFilesFromGXlf({
      gXlfFilePath: params.generatedXlfFilePath,
      langFiles: [params.filePath],
      languageFunctionsSettings,
      sortOnly: false,
      settings,
    });

    Telemetry.trackEvent("RefreshXlfTool", {});
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(result.getReport()),
    ]);
  }

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<IRefreshXlfParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: {
      title: string;
      message: vscode.MarkdownString;
    };
  }> {
    const confirmationMessages = {
      title: "Refresh XLF File?",
      message: new vscode.MarkdownString(
        `Update **${path.basename(
          options.input.filePath
        )}** from **${path.basename(options.input.generatedXlfFilePath)}**?`
      ),
    };
    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }

    return {
      invocationMessage: "Refreshing XLF File...",
      confirmationMessages,
    };
  }
}
