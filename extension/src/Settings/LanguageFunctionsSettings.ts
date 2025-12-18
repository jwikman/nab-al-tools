import { TranslationMode } from "../Enums";
import {
  ISearchReplaceBeforeSaveXliff,
  TargetState,
} from "../Xliff/XLIFFDocument";
import { Settings } from "./Settings";

export class LanguageFunctionsSettings {
  translationMode: TranslationMode;
  setExactMatchToState?: TargetState;
  clearTargetWhenSourceHasChanged: boolean;
  searchOnlyXlfFiles: boolean;
  detectInvalidValuesEnabled: boolean;
  translationSuggestionPaths: string[];
  matchBaseAppTranslation: boolean;
  autoAcceptSuggestions: boolean;
  useMatchingSetting: boolean;
  replaceSelfClosingXlfTags: boolean;
  searchReplaceBeforeSaveXliff: ISearchReplaceBeforeSaveXliff[] = [];
  formatXml = true;
  refreshXlfAfterFindNextUntranslated: boolean;
  preferLockedTranslations: boolean;
  ignoreMissingTransUnitsOnImport: boolean;
  importTranslationWithDifferentSource: boolean;
  useTargetStates: boolean;

  constructor(settings: Settings) {
    this.translationMode = this.getTranslationMode(settings);
    // For backward compatibility: use new setting if set, otherwise fall back to old setting
    this.useTargetStates =
      settings.useTargetStates || settings.useExternalTranslationTool;
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
    this.refreshXlfAfterFindNextUntranslated =
      settings.refreshXlfAfterFindNextUntranslated;
    this.preferLockedTranslations = settings.preferLockedTranslations;
    this.ignoreMissingTransUnitsOnImport =
      settings.ignoreMissingTransUnitsOnImport;
    this.importTranslationWithDifferentSource =
      settings.importTranslationWithDifferentSource;
  }

  private getTranslationMode(settings: Settings): TranslationMode {
    // For backward compatibility: check new setting first, then fall back to old setting
    const useTargetStates: boolean =
      settings.useTargetStates || settings.useExternalTranslationTool;
    if (useTargetStates) {
      return TranslationMode.targetStates;
    }
    return TranslationMode.nabTags;
  }
}
