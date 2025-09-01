import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getGlossaryTermsCore } from "./shared/GlossaryCore";
import {
  allowedLanguageCodes,
  isAllowedLanguageCode,
} from "../shared/languages";

export interface IGetGlossaryTermsParameters {
  targetLanguageCode: string;
  sourceLanguageCode?: string; // default en-us
}

export interface IGlossaryEntry {
  source: string;
  target: string;
  description: string;
}

export class GetGlossaryTermsTool
  implements vscode.LanguageModelTool<IGetGlossaryTermsParameters> {
  constructor(private readonly extensionContext: vscode.ExtensionContext) {}
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IGetGlossaryTermsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const sourceLang = params.sourceLanguageCode || "en-us";
    if (!isAllowedLanguageCode(params.targetLanguageCode)) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Error: targetLanguageCode must be one of: ${allowedLanguageCodes.join(
            ", "
          )}`
        ),
      ]);
    }
    if (params.sourceLanguageCode && !isAllowedLanguageCode(sourceLang)) {
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
      const result = getGlossaryTermsCore(
        glossaryFilePath,
        params.targetLanguageCode,
        sourceLang
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      Telemetry.trackEvent("GetGlossaryTermsTool", result.telemetry);
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
    options: vscode.LanguageModelToolInvocationPrepareOptions<IGetGlossaryTermsParameters>,
    _token: vscode.CancellationToken
  ): Promise<{
    invocationMessage: string;
    confirmationMessages: { title: string; message: vscode.MarkdownString };
  }> {
    const confirmationMessages = {
      title: "Get Glossary Terms?",
      message: new vscode.MarkdownString(
        `Get glossary entries (source: **${
          options.input.sourceLanguageCode || "en-us"
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
