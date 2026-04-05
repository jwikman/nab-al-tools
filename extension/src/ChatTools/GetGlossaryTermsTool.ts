import * as vscode from "vscode";
import * as Telemetry from "../Telemetry/Telemetry";
import { getGlossaryTermsCore, glossaryToTsv } from "./shared/GlossaryCore";
import {
  allowedLanguageCodes,
  isAllowedLanguageCode,
} from "../shared/languages";
import { resolveOutputFormat } from "./shared/OutputFormatUtils";

export interface IGetGlossaryTermsParameters {
  targetLanguageCode: string;
  sourceLanguageCode?: string; // default en-US
  localGlossaryPath?: string; // optional path to local glossary file
  ignoreMissingLanguage?: boolean; // when true, return empty if language column is missing
  outputFormat?: string; // "json" | "tsv", default "tsv"
  returnAsFile?: boolean; // when true, write result to file and return path
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
    const sourceLang = params.sourceLanguageCode || "en-US";
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
        "src",
        "mcp",
        "glossary.tsv"
      ).fsPath;
      const result = getGlossaryTermsCore(
        glossaryFilePath,
        params.targetLanguageCode,
        sourceLang,
        params.localGlossaryPath,
        params.ignoreMissingLanguage || false
      );

      if (_token.isCancellationRequested) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart("Operation cancelled by user."),
        ]);
      }

      Telemetry.trackEvent("GetGlossaryTermsTool", result.telemetry);
      const format = resolveOutputFormat(params.outputFormat, "tsv");
      let output: string;
      if (format === "tsv") {
        output = glossaryToTsv(result.data);
      } else {
        output = JSON.stringify(result.data);
      }

      if (params.returnAsFile) {
        if (!this.extensionContext.storageUri) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(
              "Warning: storageUri is not available. Returning inline content instead.\n" +
                output
            ),
          ]);
        }
        // Files in storageUri persist for session; overwritten on repeat calls
        const ext = format === "tsv" ? "tsv" : "json";
        const fileName = `glossary-${params.targetLanguageCode}.${ext}`;
        const fileUri = vscode.Uri.joinPath(
          this.extensionContext.storageUri,
          fileName
        );
        await vscode.workspace.fs.writeFile(
          fileUri,
          Buffer.from(output, "utf-8")
        );
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Result written to file: ${fileUri.fsPath}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(output),
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
    const localGlossaryInfo = options.input.localGlossaryPath
      ? ` with local glossary from **${options.input.localGlossaryPath}**`
      : "";
    const confirmationMessages = {
      title: "Get Glossary Terms?",
      message: new vscode.MarkdownString(
        `Get glossary entries (source: **${
          options.input.sourceLanguageCode || "en-US"
        }**, target: **${
          options.input.targetLanguageCode
        }**) from built-in glossary${localGlossaryInfo}.`
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
