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
  preferLockedTranslations: boolean;
  ignoreMissingTransUnitsOnImport: boolean;
  importTranslationWithDifferentSource: boolean;
  useTargetStates: boolean;

  constructor(settings: Settings) {
    this.translationMode = this.getTranslationMode(settings);
    this.useTargetStates = this.translationMode !== TranslationMode.nabTags;
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
    this.exactMatchState = this.getExactMatchToState(settings);
    this.refreshXlfAfterFindNextUntranslated =
      settings.refreshXlfAfterFindNextUntranslated;
    this.preferLockedTranslations = settings.preferLockedTranslations;
    this.ignoreMissingTransUnitsOnImport =
      settings.ignoreMissingTransUnitsOnImport;
    this.importTranslationWithDifferentSource =
      settings.importTranslationWithDifferentSource;
  }

  private getExactMatchToState(settings: Settings): TargetState | undefined {
    return settings.setExactMatchToState;
  }

  private getTranslationMode(settings: Settings): TranslationMode {
    const useExternalTranslationTool: boolean =
      settings.useExternalTranslationTool;
    if (useExternalTranslationTool) {
      return TranslationMode.external;
    }
    return TranslationMode.nabTags;
  }
}
