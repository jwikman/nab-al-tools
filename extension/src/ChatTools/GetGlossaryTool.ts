import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getGlossaryCore } from "./shared/GlossaryCore";

export interface IGetGlossaryParameters {
  targetLanguageCode: string;
  sourceLanguageCode?: string; // default en-US
}

export interface IGlossaryEntry {
  source: string;
  target: string;
  description: string;
}

export class GetGlossaryTool
  implements vscode.LanguageModelTool<IGetGlossaryParameters> {
  constructor(private readonly extensionContext: vscode.ExtensionContext) {}
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IGetGlossaryParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const sourceLang = params.sourceLanguageCode || "en-US";
    const allowedLanguageCodes = [
      "en-US",
      "cs-cz",
      "da-dk",
      "de-at",
      "de-ch",
      "de-de",
      "en-au",
      "en-ca",
      "en-gb",
      "en-nz",
      "es-es_tradnl",
      "es-mx",
      "fi-fi",
      "fr-be",
      "fr-ca",
      "fr-ch",
      "fr-fr",
      "is-is",
      "it-ch",
      "it-it",
      "nb-no",
      "nl-be",
      "nl-nl",
      "sv-se",
    ];
    if (!allowedLanguageCodes.includes(params.targetLanguageCode)) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Error: targetLanguageCode must be one of: ${allowedLanguageCodes.join(
            ", "
          )}`
        ),
      ]);
    }
    if (
      params.sourceLanguageCode &&
      !allowedLanguageCodes.includes(sourceLang)
    ) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Error: sourceLanguageCode must be one of: ${allowedLanguageCodes.join(
            ", "
          )}`
        ),
      ]);
    }

    try {
      const glossaryFilePath = vscode.Uri.joinPath(
        this.extensionContext.extensionUri,
        "resources",
        "glossary.tsv"
      ).fsPath;
      const result = getGlossaryCore(
        glossaryFilePath,
        params.targetLanguageCode,
        sourceLang
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      Telemetry.trackEvent("GetGlossaryTool", result.telemetry);
      const json = JSON.stringify(result.data);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(json),
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
    options: vscode.LanguageModelToolInvocationPrepareOptions<IGetGlossaryParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: { title: string; message: vscode.MarkdownString };
  }> {
    const confirmationMessages = {
      title: "Get Glossary?",
      message: new vscode.MarkdownString(
        `Get glossary entries (source: **${
          options.input.sourceLanguageCode || "en-US"
        }**, target: **${
          options.input.targetLanguageCode
        }**) from built-in glossary.`
      ),
    };

    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }

    return {
      invocationMessage: "Reading glossary entries...",
      confirmationMessages,
    };
  }
}
