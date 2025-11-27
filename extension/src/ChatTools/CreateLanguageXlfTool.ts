import * as vscode from "vscode";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Telemetry from "../Telemetry/Telemetry";
import { createTargetXlfFileCore } from "./shared/XliffToolsCore";
import { getAppManifestFromXlfPath } from "./shared/ToolHelpers";
import { xliffCache } from "../Xliff/XLIFFCache";

export interface ICreateLanguageXlfParameters {
  generatedXlfFilePath: string;
  targetLanguageCode: string;
  matchBaseAppTranslation?: boolean;
}

export class CreateLanguageXlfTool
  implements vscode.LanguageModelTool<ICreateLanguageXlfParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ICreateLanguageXlfParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;

    try {
      // Validate required parameters
      if (!params.generatedXlfFilePath) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: generatedXlfFilePath parameter is required."
          ),
        ]);
      }

      if (!params.targetLanguageCode) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            "Error: targetLanguageCode parameter is required."
          ),
        ]);
      }

      // Get settings from VS Code
      const settings = SettingsLoader.getSettings();

      // Get app manifest
      const appManifest = getAppManifestFromXlfPath(
        params.generatedXlfFilePath
      );

      // Use shared core logic
      const result = await createTargetXlfFileCore(
        settings,
        params.generatedXlfFilePath,
        params.targetLanguageCode,
        params.matchBaseAppTranslation ?? true,
        appManifest
      );

      // Clear the cache for this file so hover text shows updated translations
      xliffCache.delete(result.data.targetXlfFilepath);

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      // Use telemetry data from core
      Telemetry.trackEvent("CreateLanguageXlfTool", result.telemetry);

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Successfully created XLF file: "${result.data.targetXlfFilepath}" with ${result.data.numberOfMatches} matches.`
        ),
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Error: ${errorMessage}`),
      ]);
    }
  }
}
