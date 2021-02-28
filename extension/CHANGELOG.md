# Change Log

All notable changes to the "nab-al-tools" extension will be documented in this file.

<!-- 
Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
-->
## [1.0.0] Astronomy Domine - 2021-

We're out of preview no more beta!

- New features:
  - `NAB: Edit Xliff Document` opens XLF-files for editing in a webview. With the goal of reducing the clutter of XML files this feature is mainly built for translators. Command available from right clicking a XLF-file and command palette. This is the first iteration of this editor and we are grateful for any feedback you are able to send our way.
  - `NAB: Create translation XLF for new language` creates and opens a new translation file for selected target language with the option to match translations from BaseApp to get you going. The new translation file is saved as `<language-code>.xlf` in workspace translation folder. Note that there is no validation of the new target language code.
- Fixed issues
  - `NAB: Find code source of current line` did not work in some cases, [issue 93](https://github.com/jwikman/nab-al-tools/issues/93)
 
Bugs, issues and suggestions can be submitted on [GitHub](https://github.com/jwikman/nab-al-tools/issues)

## [0.3.38] Public Beta - 2021-01-29

- Updated features:
  - When `NAB: Refresh XLF files from g.xlf` is executed, common issues with the xlf files are identified and the user is notified if any issues are found. Details found in [issue 71](https://github.com/jwikman/nab-al-tools/issues/71).
  - When `NAB: Refresh XLF files from g.xlf` is executed and a translation tag ([NAB: NOT TRANSLATED], [NAB: REVIEW] and [NAB: SUGGESTION]) is added, there is also an added note that explains why this is done. The note can be identified by the "from" attribute that is set to "NAB AL Tools". If this note exists when the `NAB: Refresh XLF files from g.xlf` is executed again when the translation tag is removed, this note will be removed.
    - If the setting `NAB.UseExternalTranslationTool` is enabled this note is added as well. The note is then removed when the target state attribute is set to "translated".
  - When `NAB: Find translated texts of current line` is executed in a project that has only one translation file, the translation file will now be opened with the translation selected. If there are more than one translation file (or if the translation could not be found in the only translation file), the Find in Files feature will be used to find all occurrences of the translations. Details found in [issue 78](https://github.com/jwikman/nab-al-tools/issues/78)
  - ToolTip generation is refactored to be more robust and easier to extend in the future.
  - `NAB: Suggest ToolTips` has a new feature where ToolTips will be copied from other pages with the same SourceTable.
    - Create ToolTips for a page by using `NAB: Suggest ToolTips`, go through them with `NAB: Show next suggested ToolTip` and make them complete.
    - Create ToolTips for another page of the same SourceTable, by using `NAB: Suggest ToolTips`. The suggestion will now copy ToolTips from first page by matching the control type, name and value.
      - If it's a field we're matching with fields with the same name and value
      - If it's an action we're matching with actions with the same name.
  - When using an external translation tool (as [POEdit](https://poedit.net/)) and the setting `NAB.UseExternalTranslationTool` is enabled, there is now a few changes in how the state attribute is set:
    - When the source is changed in an existing trans-unit, the state is set to `needs-adaptation`
    - When a target is inserted in a trans-unit and the source language is the same as target language, the state is set to `needs-adaptation`
    - When a target is inserted in a trans-unit and the source language is the different than the target language, the state is set to `needs-translation`
- New settings:
  - `NAB.ShowXlfHighlights`
    - If enabled, all translation tags ([NAB: NOT TRANSLATED], [NAB: REVIEW] and [NAB: SUGGESTION]) will be highlighted ([Request 75](https://github.com/jwikman/nab-al-tools/issues/75))
    - Some common issues when writing targets manually is highlighted. Details found in [issue 71](https://github.com/jwikman/nab-al-tools/issues/71).
    - Uses the style specified in `NAB.XlfHighlightsDecoration`
  - `NAB.XlfHighlightsDecoration`
    - Specifies the style that should be used to highlight inside xlf files.

## [0.3.37] Public Beta - 2020-12-14

- New functions:
  - `NAB: Update g.xlf`
    - Updates the g.xlf file from AL files
    - Practical if you need to update translations when you don't have all symbols to compile the solution.
  - `NAB: Update all XLF files`
    - Runs the feature `NAB: Update g.xlf` followed by `NAB: Refresh XLF files from g.xlf`
  - `NAB: Match Translations From Base Application`
    - Uses Base App translations matching the target language of translation files.
    - Provides suggestions prefixed with [NAB: SUGGESTION] on untranslated trans-units where the source string is found in Base App.
  - `NAB: Download Base App Translation files`
    - Downloads Base App translations matching the target-language of the XLF files in the current workspace.
    - The files downloaded consists of json files with a size of 5-10mb.
    - The files are downloaded to the VS Code extension folder and should not be visible or otherwise affect your workspace.
    - *This feature is a preview and will likely be removed in the future to be handled in the background where needed*.
- New settings:
  - `NAB.MatchBaseAppTranslation`
    - If enabled, the `NAB: Refresh XLF files from g.xlf` function tries to match sources in the translated xlf file with translations from the BaseApplication.
    - A found match of `source` is then prefixed with [NAB: SUGGESTION] for manual review.
    - If several matches are found, all matches are added and you need delete the ones you do not want.
    - Use `NAB: Find next untranslated text` (Ctrl+Alt+U) or `NAB: Find multiple targets in XLF files` to review all matches.
    - This feature only works if `UseExternalTranslationTool` is disabled.
    - Disabled by default.
  - `NAB.TranslationSuggestionPaths`:
    - Supply any relative paths that contains xlf files that should be used when matching translations.
    - The `NAB: Refresh XLF files from g.xlf` function will try to match any untranslated targets with targets in the xlf files in the provided folders that has matching target language.

## [0.3.35] Public Beta - 2020-10-15

- `NAB: Generate ToolTip Documentation` updated
  - Sort controls by type
  - Don't add page parts that does not exist in tooltip doc
  - No app name in header

## [0.3.34] Public Beta - 2020-09-23

- New feature: `NAB: Generate ToolTip Documentation`. Generates a MarkDown (.md) file with the ToolTips for Pages and Page Extensions. Check out README for more info.

## [0.3.33] Public Beta - 2020-07-10

- Select more of the generated text when using `NAB: Show next suggested ToolTip`

## [0.3.31] Public Beta - 2020-07-02

- Do not change the field name to lowercase in the ToolTip stubs.

## [0.3.30] Public Beta - 2020-06-16

- Adds support to create ToolTip stubs.
  - `NAB: Suggest ToolTips` inserts a ToolTip stub on page fields and actions. The stub will be commented out and needs to be reviewed, updated and un-commented manually.
    - This function only works when you're in a file that has a Page och Page extension object
    - No ToolTips will be added on fields on NavigatePages or API pages
  - `NAB: Show next suggested ToolTip` (Ctrl+Alt+P) shows the next ToolTip stub in the current Page or PageExtension

## [0.3.29] Public Beta - 2020-04-29

- Adds support for interfaces and implements statememts. More info in this [issue](https://github.com/jwikman/nab-al-tools/issues/36)

## [0.3.28] Public Beta - 2020-04-03

- Fixes issue where `NAB: Refresh XLF files from g.xlf` could produce a target as `[NAB: SUGGESTION][NAB: NOT TRANSLATED]`

## [0.3.27] Public Beta - 2020-04-02

- New setting `NAB.MatchTranslation`, solves the issue [Automatic search for similar translations](https://github.com/jwikman/nab-al-tools/issues/9)
  - If enabled, the `NAB: Refresh XLF files from g.xlf` function tries to match sources in the translated xlf file to reuse translations.
  - A found match of "source" will be copied and prefixed with `[NAB: SUGGESTION]` for manual review.
  - If several matches are found, all matches are added and you need delete the ones you do not want.
  - Use `NAB: Find next untranslated text` (Ctrl+Alt+U) or `NAB: Find multiple targets in XLF files` to review all matches
  - This feature only works if `NAB.UseExternalTranslationTool` is disabled.
  - This setting is enabled as default
- New feature `NAB: Match translations from external XLF file`, solves the issue [Match translated texts from an external xlf file](https://github.com/jwikman/nab-al-tools/issues/31)
  - Use this to match your source texts with another xlf file (with a matching target language) to find translation suggestions. All found matches will be prefixed with `[NAB: SUGGESTION]`
- New feature `NAB: Find multiple targets in XLF files`
  - Use this command to find all places where you've got multiple targets, caused by the matching finding multiple sources with different translations

## [0.3.26] Public Beta - 2020-03-31

- New setting `NAB.SearchOnlyXlfFiles`
  - If enabled, the `NAB:Find Untranslated texts` function only searches \*.xlf files. Be aware of that the \*.xlf file filter remains in "Find in Files" after this command has been run. This should be enabled in large projects (as Base Application) for performance reasons.
- New snippet `tistemporarycheck`
  - This check prevents that a temporary parameter that is passed by reference (var) is called with a record that is not temporary.
- Dependency updates

## [0.3.25] Public Beta - 2019-12-10

- Fixed anchor links in README. (changed to lowercase, since that seems to be necessary on the Marketplace site)

## [0.3.24] Public Beta - 2019-12-10

- New feature [Use state property in xlf-files](https://github.com/jwikman/nab-al-tools/issues/17)
  - Use setting `NAB.UseExternalTranslationTool` if you're using an external tool for translation
  - Implemented by [theschitz](https://github.com/theschitz) in [PR 18](https://github.com/jwikman/nab-al-tools/pull/18), thanks!
- New snippet "Declare Enum value" ("tenumvalue (NAB)") through [PR 7](https://github.com/jwikman/nab-al-tools/pull/7) by [theschitz](https://github.com/theschitz)
- Fixes [issue 16 - 'MlToken RegExp failed' thrown if wrong casing used for properties](https://github.com/jwikman/nab-al-tools/issues/16).
- Fixes [issue 23 - Improving FindNextUntranslatedByToken](https://github.com/jwikman/nab-al-tools/issues/23).
  - Implemented by [theschitz](https://github.com/theschitz) in [PR 24](https://github.com/jwikman/nab-al-tools/pull/24), thanks!

## [0.3.23] Public Beta - 2019-10-23

- Fixes [issue 14 - NAB: Refresh XLF files from g.xlf - fails if invalid chars in app name](https://github.com/jwikman/nab-al-tools/issues/14).

## [0.3.22] Public Beta - 2019-09-15

- Fixes [issue 5 - Empty elements are replaced with self-closing tags](https://github.com/jwikman/nab-al-tools/issues/5). Self-closing tags is now replaced by regular ending tags.
  - `<note ... />` is now converted to `<note ... ></note>`
  - if the developer note is missing from target file, it is now readded from the source file

## [0.3.20] Public Beta - 2019-06-26

- New function: "NAB: Copy \<source\> to \<target\>"
  - Use this when positioned on a target line in a xlf file to copy the content of the \<source\> element to the \<target\> that are selected

## [0.3.19] Public Beta - 2019-06-12

- New logo
- New function: "NAB: Sort XLF files as g.xlf"
  - Updates all language xlf files with the same sorting as the g.xlf file
- Updated dependency versions

## [0.3.17] Public Beta - 2019-05-26

- Updated readme
- New snippets through [PR 2](https://github.com/jwikman/nab-al-tools/pull/2) from my colleague [theschitz](https://github.com/theschitz)!

## [0.3.13] Public Beta - 2019-05-14

- Fix issue [Error in NAB: Refresh XLF Files from g.xml](https://github.com/jwikman/nab-al-tools/issues/1)

## [0.3.12] Public Beta - 2019-05-13

- Initial public release
