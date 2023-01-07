import { TranslationMode } from "../Enums";
import { TargetState } from "../Xliff/XLIFFDocument";
import { ISearchReplaceBeforeSaveXliff, Settings } from "./Settings";

export class LanguageFunctionsSettings {
  translationMode: TranslationMode;
  useExternalTranslationTool: boolean;
  searchOnlyXlfFiles: boolean;
  detectInvalidValuesEnabled: boolean;
  translationSuggestionPaths: string[];
  matchBaseAppTranslation: boolean;
  useMatchingSetting: boolean;
  replaceSelfClosingXlfTags: boolean;
  searchReplaceBeforeSaveXliff: ISearchReplaceBeforeSaveXliff[] = [];
  exactMatchState?: TargetState;
  formatXml = true;
  refreshXlfAfterFindNextUntranslated: boolean;
  useDictionaryInDTSImport: boolean;
  preferLockedTranslations: boolean;

  constructor(settings: Settings) {
    this.translationMode = this.getTranslationMode(settings);
    this.useExternalTranslationTool = settings.useExternalTranslationTool;
    this.searchOnlyXlfFiles = settings.searchOnlyXlfFiles;
    this.detectInvalidValuesEnabled = settings.detectInvalidTargets;
    this.translationSuggestionPaths = settings.translationSuggestionPaths;
    this.matchBaseAppTranslation = settings.matchBaseAppTranslation;
    this.useMatchingSetting = settings.matchTranslation;
    this.replaceSelfClosingXlfTags = settings.replaceSelfClosingXlfTags;
    this.searchReplaceBeforeSaveXliff = settings.searchReplaceBeforeSaveXliff;
    this.exactMatchState = this.getDtsExactMatchToState(settings);
    this.refreshXlfAfterFindNextUntranslated =
      settings.refreshXlfAfterFindNextUntranslated;
    this.useDictionaryInDTSImport = settings.useDictionaryInDTSImport;
    this.preferLockedTranslations = settings.preferLockedTranslations;
  }

  private getDtsExactMatchToState(settings: Settings): TargetState | undefined {
    const setDtsExactMatchToState: string = settings.setDtsExactMatchToState;
    let exactMatchState: TargetState | undefined;
    if (setDtsExactMatchToState.toLowerCase() !== "(keep)") {
      exactMatchState = setDtsExactMatchToState as TargetState;
    }
    return exactMatchState;
  }

  private getTranslationMode(settings: Settings): TranslationMode {
    const useDTS: boolean = settings.useDTS;
    if (useDTS) {
      return TranslationMode.dts;
    }
    const useExternalTranslationTool: boolean =
      settings.useExternalTranslationTool;
    if (useExternalTranslationTool) {
      return TranslationMode.external;
    }
    return TranslationMode.nabTags;
  }

  public get useDTSDictionary(): boolean {
    return (
      this.translationMode === TranslationMode.dts &&
      this.useDictionaryInDTSImport
    );
  }
}
