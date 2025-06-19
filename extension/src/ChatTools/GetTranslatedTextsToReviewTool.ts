import * as vscode from "vscode";
import * as fs from "fs";
import {
  CustomNoteType,
  TargetState,
  TranslationToken,
  TransUnit,
  Xliff,
} from "../Xliff/XLIFFDocument";
import * as Telemetry from "../Telemetry/Telemetry";

export interface ITranslatedTextsParameters {
  filePath: string;
  offset?: number;
  limit: number;
  translationStateFilter?: string;
  sourceLanguageFilePath?: string;
}

export interface ITranslatedText {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  targetText: string;
  comment?: string;
  translationState?: string;
  reviewReason?: string;
  maxLength?: number;
}

export class GetTranslatedTextsToReviewTool
  implements vscode.LanguageModelTool<ITranslatedTextsParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ITranslatedTextsParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = options.input;
    const maxCount = params.limit;
    const offset = params.offset || 0;
    const useCustomSourceLanguage = params.sourceLanguageFilePath
      ? params.sourceLanguageFilePath !== ""
      : false;
    const defaultLanguage = "en-US";
    let sourceLanguage = defaultLanguage;

    if (!params.filePath) {
      throw new Error(
        "The File path parameter is required. Please provide an absolute path to a XLF file. The path must be absolute, not relative."
      );
    }
    if (!fs.existsSync(params.filePath)) {
      throw new Error(
        `The file at path ${params.filePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
      );
    }
    let sourceXliffDoc: Xliff | undefined;
    if (useCustomSourceLanguage) {
      const sourceLanguageFilePath = params.sourceLanguageFilePath || "";

      if (!fs.existsSync(sourceLanguageFilePath)) {
        throw new Error(
          `The source language file at path ${sourceLanguageFilePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
        );
      }
      sourceXliffDoc = Xliff.fromFileSync(sourceLanguageFilePath);
      sourceLanguage = sourceXliffDoc.targetLanguage;
    }

    const xliffDoc = Xliff.fromFileSync(params.filePath);

    if (!xliffDoc) {
      throw new Error(
        `Failed to load XLIFF document from ${params.filePath}. Please ensure the file is a valid XLIFF file.`
      );
    }
    let counter = 0;
    const translationsToExport = xliffDoc.transunit.filter((tu) =>
      shouldBeExported(tu, params.translationStateFilter)
    );
    const response: ITranslatedText[] = [];
    translationsToExport.forEach((tu) => {
      counter++;
      if (
        (counter - offset > maxCount && maxCount !== 0) ||
        _token.isCancellationRequested
      ) {
        return;
      }
      if (counter > offset) {
        let sourceText = tu.source;
        let currentSourceLanguage = sourceLanguage;
        if (useCustomSourceLanguage) {
          const sourceTu = sourceXliffDoc?.getTransUnitById(tu.id);
          if (sourceTu) {
            sourceText = sourceTu.target.textContent;
          } else {
            currentSourceLanguage = defaultLanguage;
          }
        }
        let maxLength = undefined;
        if (tu.maxwidth) {
          maxLength = tu.maxwidth;
        }
        response.push({
          id: tu.id,
          sourceText: sourceText,
          sourceLanguage: currentSourceLanguage,
          targetText: tu.target.textContent,
          maxLength: maxLength,
          comment: !tu.developerNote()
            ? undefined
            : tu.developerNoteContent() === ""
            ? undefined
            : tu.developerNoteContent(),
          reviewReason: getReviewReason(tu),
          translationState: getTranslationState(tu),
        });
      }
    });
    if (_token.isCancellationRequested) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Operation cancelled by user."),
      ]);
    }
    Telemetry.trackEvent("GetTranslatedTextsToReviewTool", {
      sourceLanguage: sourceLanguage,
      targetLanguage: xliffDoc.targetLanguage,
      offset: offset,
      limit: maxCount,
      resultCount: response.length,
    });
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
      title: "Get Texts To Review?",
      message: new vscode.MarkdownString(
        `Get texts to review from file **${options.input.filePath}**?`
      ),
    };

    if (_token.isCancellationRequested) {
      return {
        invocationMessage: "Operation cancelled by user.",
        confirmationMessages,
      };
    }
    return {
      invocationMessage: "Getting texts to review...",
      confirmationMessages,
    };
  }
}
function shouldBeExported(
  tu: TransUnit,
  translationStateFilter: string | undefined
): boolean {
  if (tu.target.textContent === "") {
    return false;
  }
  switch (translationStateFilter) {
    case undefined:
    case "":
      return true;
    case "translated":
      return (
        tu.target.state === "translated" ||
        (!tu.target.state && !tu.target.translationToken)
      );
    case "needs-review":
      return (
        tu.targetState === TargetState.needsAdaptation ||
        tu.targetState === TargetState.needsL10n ||
        tu.targetState === TargetState.needsReviewAdaptation ||
        tu.targetState === TargetState.needsReviewTranslation ||
        tu.targetState === TargetState.needsReviewL10n ||
        tu.targetTranslationToken === TranslationToken.review ||
        tu.targetTranslationToken === TranslationToken.suggestion
      );
    case "final":
      return tu.targetState === TargetState.final;
    case "signed-off":
      return tu.targetState === TargetState.signedOff;
    default:
      throw new Error(
        `Invalid translation state filter: ${translationStateFilter}. Valid states are 'translated', 'needs-review', 'final','signed-off'. Skip this filter to include all translations.`
      );
  }
}
function getReviewReason(tu: TransUnit): string | undefined {
  if (tu.targetState === "" && tu.targetTranslationToken === "") {
    return undefined;
  }
  const reason = tu.customNoteContent(CustomNoteType.refreshXlfHint);
  if (reason !== "") {
    return reason;
  }
  let targetStateExplanation = "";
  switch (tu.targetState) {
    case "":
      break;
    case TargetState.final:
      targetStateExplanation = "State indicates the terminating state.";
      break;
    case TargetState.needsAdaptation:
      targetStateExplanation =
        "State indicates only non-textual information needs adaptation.";
      break;
    case TargetState.needsL10n:
      targetStateExplanation =
        "State indicates both text and non-textual information needs adaptation.";
      break;
    case TargetState.needsReviewAdaptation:
      targetStateExplanation =
        "State indicates only non-textual information needs review.";
      break;
    case TargetState.needsReviewL10n:
      targetStateExplanation =
        "State indicates both text and non-textual information needs review.";
      break;
    case TargetState.needsReviewTranslation:
      targetStateExplanation =
        "State indicates that only the text of the item needs to be reviewed.";
      break;
    case TargetState.needsTranslation:
      targetStateExplanation =
        "State indicates that the item needs to be translated.";
      break;
    case TargetState.new:
      targetStateExplanation = "State indicates that the item is new.";
      break;
    case TargetState.signedOff:
      targetStateExplanation =
        "State indicates that changes are reviewed and approved.";
      break;
    case TargetState.translated:
      targetStateExplanation =
        "State indicates that the item has been translated.";
      break;
  }
  if (targetStateExplanation !== "") {
    return targetStateExplanation;
  }
  return undefined;
}

function getTranslationState(tu: TransUnit): string | undefined {
  if (tu.targetState === "" && tu.targetTranslationToken === "") {
    return undefined;
  }
  switch (tu.targetTranslationToken) {
    case TranslationToken.review:
    case TranslationToken.suggestion:
      return "needs-review";
  }
  if (tu.targetState) {
    return tu.targetState;
  }

  return TargetState.translated; // Not using target states, and have no translation token, so we assume it's translated.
}
