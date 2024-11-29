import { TranslationMode } from "../Enums";
import {
  ISearchReplaceBeforeSaveXliff,
  TargetState,
} from "../Xliff/XLIFFDocument";
import { Settings } from "./Settings";

export class LanguageFunctionsSettings {
  translationMode: TranslationMode;
  useExternalTranslationTool: boolean;
  setExactMatchToState: TargetState;
  clearTargetWhenSourceHasChanged: boolean;
  searchOnlyXlfFiles: boolean;
  detectInvalidValuesEnabled: boolean;
  translationSuggestionPaths: string[];
  matchBaseAppTranslation: boolean;
  autoAcceptSuggestions: boolean;
  useMatchingSetting: boolean;
  replaceSelfClosingXlfTags: boolean;
  searchReplaceBeforeSaveXliff: ISearchReplaceBeforeSaveXliff[] = [];
  exactMatchState?: TargetState;
  formatXml = true;
  refreshXlfAfterFindNextUntranslated: boolean;
  useDictionaryInDTSImport: boolean;
  preferLockedTranslations: boolean;
  ignoreMissingTransUnitsOnImport: boolean;

  constructor(settings: Settings) {
    this.translationMode = this.getTranslationMode(settings);
    this.useExternalTranslationTool = settings.useExternalTranslationTool;
    this.setExactMatchToState = settings.setExactMatchToState;
    this.clearTargetWhenSourceHasChanged =
      settings.clearTargetWhenSourceHasChanged;
    this.searchOnlyXlfFiles = settings.searchOnlyXlfFiles;
    this.detectInvalidValuesEnabled = settings.detectInvalidTargets;
    this.translationSuggestionPaths = settings.translationSuggestionPaths;
    this.matchBaseAppTranslation = settings.matchBaseAppTranslation;
    this.autoAcceptSuggestions = settings.autoAcceptSuggestions;
    this.useMatchingSetting = settings.matchTranslation;
    this.replaceSelfClosingXlfTags = settings.replaceSelfClosingXlfTags;
    this.searchReplaceBeforeSaveXliff = settings.searchReplaceBeforeSaveXliff;
    this.exactMatchState = this.getDtsExactMatchToState(settings);
    this.refreshXlfAfterFindNextUntranslated =
      settings.refreshXlfAfterFindNextUntranslated;
    this.useDictionaryInDTSImport = settings.useDictionaryInDTSImport;
    this.preferLockedTranslations = settings.preferLockedTranslations;
    this.ignoreMissingTransUnitsOnImport =
      settings.ignoreMissingTransUnitsOnImport;
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
