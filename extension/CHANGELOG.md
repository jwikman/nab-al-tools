# Changelog

All notable changes to the "nab-al-tools" extension will be documented in this file.

<!-- 
Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

-->

## [1.12] - 2022-01

- New features:
  - `NAB: Convert to PermissionSet object` converts a PermissionSet defined in XML into a PermissionSet object.
    - The user is prompted to supply a prefix that will be used for the object names. The default value is fetched from the first `mandatoryAffixes` in the AppSourceCop.json, if available.
    - The prefix is added to the old RoleID as a suggested Name for the new PermissionSet object.
    - The old RoleName is added as a suggested Caption for the new PermissionSet object.
    - The Name and Caption is editable before conversion starts.
    - Some validation tests are being done on the provided names and captions.
      - Max length
      - Non-empty
      - Some illegal characters
      - etc.
    - After the PermissionSet objects has been created, the old Xml PermissionSet files are deleted.
    - An upgrade codeunit is created that maps the usage of the old Xml PermissionSet to the new PermissionSet object.

## [1.10] - 2021-12-20

- New features:
  - NAB AL Tools now supports the new pre-release functionality in VSCode v1.63 and later.
    - Read more in the [release notes](https://code.visualstudio.com/updates/v1_63#_pre-release-extensions) for VSCode.
  - Show translations when hovering over a translated text in AL.
    - When hovering over an AL code line with a translated text, as a Caption or Label, all available translations are showed in a hover window.
    - Each translation links to the translation inside the XLF file.
    - A new setting, `NAB.EnableTranslationsOnHover`, is added to enable/disable this feature. It is enabled by default.
      - It is recommended to disable this feature on workspaces with very large XLF files, since it can slow down the system significantly.
  - Anonymous usage telemetry is now activated. It is recommended to allow this, so we can know which features are used and which ones are not used. Use the `NAB.EnableTelemetry` setting to disable telemetry.
- Fixes:
  - Report Extensions with modified columns was not supported, see [issue 221](https://github.com/jwikman/nab-al-tools/issues/221).

## [1.7.2] - 2021-11-30

- Fixes:
  - When a source is not found when using `NAB: Find source of current Translation Unit` (F12) in a XLF file, due to a missing caption or removed control, an error was shown that no code could be found. See [issue 218](https://github.com/jwikman/nab-al-tools/issues/218) for details. This is now changed so that it tries to find the closest parent that exists. So if a caption for a table field is missing, the field is shown. If a page field is completely removed, the page is shown, etc. This is especially useful if using the `GenerateCaptions` feature. Thanks to [@DavidFeldhoff](https://github.com/DavidFeldhoff) for finding this and proposing a solution, writing tests etc. Very much appreciated!

## [1.7.1] - 2021-11-28

- Changes:
  - Renamed command `NAB: Find code source of current line` to `NAB: Find source of current Translation Unit`.
  - Added progressbar for commands:
    - `NAB: Generate External Documentation`
    - `NAB: Generate ToolTip Documentation`
- Fixes:
  - `NAB: Find source of current Translation Unit` didn't support all types of custom notes in the xlf file, see [issue 216](https://github.com/jwikman/nab-al-tools/issues/216). This is now fixed by [@DavidFeldhoff](https://github.com/DavidFeldhoff), thanks!

## [1.7.0] - 2021-11-25

- New features:
  - `NAB: Export Translations to .csv (Select columns and filter)` export XLF as CSV but you choose the columns to include in the exported file. `Id`, `Source` and `Target` are always exported and thus not selectable in the quick pick. A filter option of `All` and `In need of review` is also available.
  - `NAB: Import DTS Translations` now has the support of a dictionary. Machine translation helps with the bulk of the work but sometimes the translations doesn't quite match the context. The dictionary is intended to substitute the words that continuously get the wrong translation. The dictionary is created and stored in the `Translations` folder of your AL project. The dictionary is a JSON file and one file per target language is created. Naming convention `<language-code>.dts.json`. See further documentation in README.
- Changes:
  - To enable matching of translations with Base App we store map files in json format in a blob storage. The files are then downloaded when needed (if you have selected to match with Base App in the settings). At times the download would fail which could lead to empty or corrupted files which in turn could lead to errors with poor information. To mitigate the effects of this we have improved the information presented when certain functions fail. Translation maps corrupted by failed download are now also deleted which in turn will lead to a new download when triggered by either `NAB: Download Base App Translation Files`, `NAB: Refresh XLF Files from g.xlf` or `NAB: Update all XLF Files`. We haven't yet solved the problem within the download leaving corrupted files, we'll continue to investigate this. At the moment poor connection speeds seems to be the problem, we hope to find a way to work around it. Please continue to report any problems you run into regarding this by creating an [issue](https://github.com/jwikman/nab-al-tools/issues). Big thanks to [@RodrigoPuelma](https://github.com/RodrigoPuelma) for bringing this to our attention in [issue 190](https://github.com/jwikman/nab-al-tools/issues/190).
  - Added "app-name" to the info.json created when external documentation is generated.
  - Enums that are extensible are now included when external documentation is generated.
  - The notes added to xlf files when running `NAB: Refresh XLF Files from g.xlf` or `NAB: Update all XLF Files` is now decorated.
- Fixes:
  - The parsing of the object descriptor (the first line in an AL Object) is now improved to better handle double quotes (") in name and comments. Thanks [@DavidFeldhoff](https://github.com/DavidFeldhoff) for reporting and suggesting a fix!

## [1.6.0] - 2021-08-23

- New features:
  - Trans-units with empty sources are now flagged. An empty source is often not supposed to be translated and the caption should be given the attribute `Locked = true`. When running `NAB: Refresh XLF files from g.xlf` a note is added to the trans-unit suggesting this: `Source contains only white-space, consider using 'Locked = true' to avoid translation of unnecessary texts`. Suggested in [issue 179](https://github.com/jwikman/nab-al-tools/issues/179).
- Fixed:
  - In the case of a trans-unit missing a "Xliff Generator"-note an error message (`Cannot read property 'textContent' of undefined`) would be shown when running `NAB: Refresh XLF files from g.xlf`. This has now been fixed and a better error message with the trans-unit id will now be shown. Big thanks to [@skyttedk](https://github.com/skyttedk) for reporting this in [issue 181](https://github.com/jwikman/nab-al-tools/issues/181).
  - Fields in a Request Page in XmlPorts was not supported, this is now fixed. Big thanks to [@ngiessel](https://github.com/ngiessel) for reporting this in [issue 187](https://github.com/jwikman/nab-al-tools/issues/187).

## [1.5.0] - 2021-08-16

- New features:
  - Support for PermissionSet object type ([issue 182](https://github.com/jwikman/nab-al-tools/issues/182))

## [1.4.0] - 2021-07-05

- Changes:
  - To ensure that that xliff files is in sync with g.xlf when finishing translation work we've added a call to `NAB: Refresh XLF files from g.xlf` as the last step in `NAB: Set Translation Unit to "..." (Ctrl+Alt+Q)` and `NAB: Find next untranslated text (Ctrl+Alt+U)`
    - This is regulated by a new setting `NAB.RefreshXlfAfterFindNextUntranslated` specifies if `NAB: Refresh XLF files from g.xlf` should run after no more trans-units in need of action are found.
- Fixed:
  - When running `NAB: Refresh XLF files from g.xlf` the information message would say "Nothing changed in x XLF files" even though 1 or more targets could have been marked for review.

## [1.3.0] - 2021-06-21

- Changes:
  - Dependency on module jDataView removed and replaced with internal implementation of a BinaryReader.
  - Improved handling of how procedures are identified with better handling of compiler directives, XmlComments and comments.
- Fixed:
  - The checkbox in the Xliff Editor stopped working somewhere along the way. This is now fixed

## [1.2.0] - 2021-06-03

- New features:
  - Code restructured to be able to execute the `NAB: Generate External Documentation` function from cli, without dependency on vscode.
  - Code inside the vsix for this extension is now bundled with WebPackage to improve performance and reduce the size of the vsix file.
  - Symbols are now loaded from the .alpackages folder. This is used when documentation is created, ToolTips are added etc. The setting `NAB.LoadSymbols` specifies if symbols should be loaded or not.
  - To make the work with Dynamics 365 Translation Service (DTS) a bit easier, a few things are added. More details can be found in [issue 149](https://github.com/jwikman/nab-al-tools/issues/149).
    - A new setting, `NAB.UseDTS`, that should be set if you are using Dynamics 365 Translation Service. This setting makes the xliff align better with how DTS updates the xliff files and affects several features in this extension.
    - A new feature, `NAB: Format current XLF file for DTS`, that formats the currently open XLF file in the same way as DTS does. All currently translated trans-units, that has no previous state, is now considered correctly translated so the XLF can be used as a translation memory file.
    - New feature, `NAB: Open DTS (Dynamics 365 Translation Service)`, that create zip files with all xlf files in the translation folder in a '.dts' folder and then opens the Dynamics 365 Translation Service with the project configured in the `NAB.DTS ProjectId`setting.
    - A new feature `NAB: Import DTS Translations` provides functionality to import the zip files that DTS generates as output from a translation request. The zip files should be saved in the ".dts" folder created by `NAB: Open DTS (Dynamics 365 Translation Service)`. The xlf-file in selected output.zip files will be used to import any translations that has been done.
      - A new setting `NAB.Set DTS Exact Match To State` makes it possible to set the Target State to a configured state, if a "exact-match" translation is found in the file that is being imported.
    - New features, `NAB: Set Translation Unit to "translated"`, `NAB: Set Translation Unit to "signed-off"` and `NAB: Set Translation Unit to "final"`, that can be used when editing XLF files manually.
      - When a translation unit is considered translated and complete, this function can be called to set the translation unit target state.
  - A new setting `NAB.DetectInvalidTargets` enables detection of some common translation mistakes. Eg. same number of OptionCaptions, blank OptionCaptions and placeholders as `@1@@@@@@`, `#2########`, `%1`, `%2` etc . The detection will occur during several different actions, as Import from DTS or Refresh Xlf. This setting is enabled by default. If any false positives are detected (the system says it is invalid, but in fact it is correct), please log an issue on GitHub and disable this feature until it's fixed.
  - A new setting can be used to set the Target State when importing translations from a .csv file, `NAB.Xliff CSV Import Target State`. There are basically three type of options: Leave the State as-is, update the State from the .csv file or set the State to a configured value for all modified targets.
  - New settings related to the `NAB: Generate External Documentation` feature:
    - `NAB.CreateInfoFileForDocs` - When creating external documentation, this setting specifies if an info.json file should be created. This file will contain version info, creation date etc.
    - `NAB.IncludeTablesAndFieldsInDocs` - When creating external documentation, this setting specifies if all tables and fields should be included. If not enabled, only tables with public procedures will be included.
    - `NAB.CreateUidForDocs` - When creating external documentation, this setting specifies if an UID should be created in a Yaml Header in each generated md file. The UID can then be used for linking in DocFx.
- Changes:
  - The default setting for some settings has been changed an "Opt-out" approach instead of the current "Opt-in" approach. The following settings is now enabled by default:
    - `NAB.MatchBaseAppTranslation`
    - `NAB.GenerateTooltipDocsWithExternalDocs`
    - `NAB.GenerateDeprecatedFeaturesPageWithExternalDocs`
    - `NAB.CreateTocFilesForDocs`
    - `NAB.CreateUidForDocs`
- Fixed:
  - When executing any of the `NAB: XML Comment - Format` functions without a selection, the cursor will now be placed inside the added formatting tag.
  - When using the function findTranslatedTexts from some *.al file in Base Application, then it fails with breaking error "Files above 50MB cannot be synchronized with extensions.". This is now fixed in [PR 157](https://github.com/jwikman/nab-al-tools/pull/157) by [zabaq](https://github.com/zabcik) - thanks!
  - When executing `NAB: Create translation XLF for new language`, no targets was added to the resulting xlf file. Details in [issue 162](https://github.com/jwikman/nab-al-tools/issues/162). Thanks to [Steven-Bale](https://github.com/Steven-Bale) for reporting this issue.

## [1.1.0] 2021-03-30

- New features:
  - A few functions is added to help with formatting of XML Comments. Just select some text in XML Comments and execute the function to get the text surrounded with formatting tags.
    - `NAB: XML Comment - Format bold`
    - `NAB: XML Comment - Format italic`
    - `NAB: XML Comment - Format inline code`
    - `NAB: XML Comment - Format paragraph`
    - `NAB: XML Comment - Format code block`
  - Import and export Xliff files as .csv
    - `NAB: Export Translations to .csv` exports translation units from a selected XLF file as tab separated values. View [README](README.md#nab-export-translations-to-csv) for full documentation.
    - `NAB: Import Translations from .csv` imports and updates targets of selected XLF file from a .csv file. View [README](README.md#nab-import-translations-from-csv) for full documentation.
    - Related settings:
      - `NAB.Xliff CSV Export Path` sets the export path for `NAB: Export Translations to .csv`. Default path for export is the Translation file directory.
- Fixed issues
  - Fixed issue #130, "NAB: Find source of current Translation Unit" broken if there's special characters in name

## [1.0.0] Out of preview - 2021-03-23

We're out of preview no more beta!

- New features:
  - `NAB: Edit Xliff Document` opens XLF-files for editing in a webview. With the goal of reducing the clutter of XML files this feature is mainly built for translators. Command available from right clicking a XLF-file and command palette. This is the first iteration of this editor and we are grateful for any feedback you are able to send our way.
    - Keyboard navigation:
      - `Arrow Up` / `Arrow down` moves focus between lines.
      - `F8`  copies the target text from the line above.
      - `TAB` focus is moved between the target textarea and the complete checkbox and then the next line.
      - `Space` can be used to toggle the complete checkbox when it's in focus.
  - `NAB: Create translation XLF for new language` creates and opens a new translation file for selected target language with the option to match translations from BaseApp to get you going. The new translation file is saved as `<app-name>.<language-code>.xlf` in workspace translation folder. Note that there is no validation of the new target language code.
  - `NAB: Generate External Documentation` generates documentation that is intended to be used as an external documentation. I.e. to be read by someone that wants to extend the app by API, Web Services or with an extension. The documentation is created as [markdown](https://en.wikipedia.org/wiki/Markdown) files. The markdown files could  be transformed to html files with the help of [DocFx](https://dotnet.github.io/docfx/) or other tools.
    - The content is generated from the AL code and the [XML Comments](https://docs.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-xml-comments) that are written in the AL code.
      - In the first release the following XML Comments are supported
        - `<summary>`
        - `<param>`
        - `<returns>`
        - `<remarks>`
        - `<example>`
      - The following formatting tags are supported in the first release
        - `<para>`
        - `<b>`
        - `<i>`
        - `<c>`
        - `<code>`
      - The first line in the summary tag for object, procedure or event are used for all objects, procedures or events overview pages in the documentation.
    - There are three types of files that are created with their own index page. The different index files will only be created if there are any objects of that type.
      - "Public Objects" - Objects that has either public procedures or public events. Can be Codeunits, Tables, Table Extensions, Pages, Page Extensions or Interfaces.
      - "API" - API Pages and API Queries
      - "Web Services" - Pages or Codeunits that are published as Web Services through a webservices.xml file
    - Several new settings to support the new documentation:
      - `NAB.TooltipDocsFilePath` - When creating ToolTip documentation, this setting specifies the path and filename of the md file that should be used. Both absolute and relative (to the current workspace folder) can be used.
      - `NAB.GenerateTooltipDocsWithExternalDocs` - When creating external documentation, this setting specifies if the ToolTip file should be created as well.
      - `NAB.DocsRootPath` - When creating external documentation, this setting specifies where all md files will be created. Both absolute and relative (to the current workspace folder) can be used.
      - `NAB.CreateTocFilesForDocs` - When creating external documentation, this setting specifies if TOC (table of contents) files should be created.
      - `NAB.RemoveObjectNamePrefixFromDocs` - When creating external documentation, this setting will remove the specified prefix from the md files. I.e. if your objects are prefixed with \"ABC \", you set this setting to \"ABC\" and that will be removed from the object names in the md files.
      - `NAB.DocsIgnorePaths` - When documentation are created from al files, the files that matches the patterns specified in this setting will be ignored. The paths should use glob pattern.
      - `NAB.GenerateDeprecatedFeaturesPageWithExternalDocs` - When creating external documentation, this setting specifies if a page with public obsoleted objects/procedures/controls should be created.
- Fixed issues
  - `NAB: Sign App File` failed since the timestamp server `http://timestamp.verisign.com/` does not work anymore. This is solved by a new setting, `NAB.SigningTimeStampServer`, where you can setup any TimeStampServer, or just use the new default one: `http://timestamp.digicert.com` ([issue 131](https://github.com/jwikman/nab-al-tools/issues/131))
  - `NAB: Find source of current Translation Unit` did not work in some cases, [issue 93](https://github.com/jwikman/nab-al-tools/issues/93)
  - `NAB: Find Next Untranslated` now cleans up missed notes ("NAB AL Tool Refresh Xlf") that could be left behind if the refresh function wasn't run again.
  - `NAB: Find Next Untranslated` also presents any occurrence of multiple targets in the .xlf file.
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

- Adds support for interfaces and implements statements. More info in this [issue](https://github.com/jwikman/nab-al-tools/issues/36)

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
  - if the developer note is missing from target file, it is now re-added from the source file

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
