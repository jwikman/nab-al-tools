# Change Log

All notable changes to the "nab-al-tools" extension will be documented in this file.

<!-- 
Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
-->
## [Unreleased]

- New features:
  - When `NAB: Refresh XLF files from g.xlf` is executed, common issues with the xlf files are identified and the user is notified if any issues are found. Details found in [issue 71](https://github.com/jwikman/nab-al-tools/issues/71).
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
