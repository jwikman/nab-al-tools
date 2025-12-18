# Changelog

All notable changes to the "nab-al-tools" extension will be documented in this file.

<!--
Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

-->

## [1.45 - pre-release]

- Added:
  - Added support for local glossaries in `getGlossaryTerms` tool. The tool now accepts an optional `localGlossaryPath` parameter that allows merging project-specific glossaries with the built-in Business Central glossary. When duplicate terms exist (same source text), the local glossary takes precedence. If reading the local glossary file fails, a descriptive error message explains the expected TSV format: first column en-US, last column Description (optional), columns in between are language codes, and the first line must contain ISO language codes as headers. This enhancement applies to both the Language Model Tool (VS Code extension) and the MCP server.
  - Added `openFile` Language Model Tool that opens and focuses files in the VS Code editor. This tool is particularly useful for establishing file context before invoking other VS Code tools that operate on the currently focused file (e.g., `ms-dynamics-smb.al/al_build`, formatters, analyzers). The tool accepts a file path (absolute or relative to workspace) and optional line number and column number for cursor positioning. It focuses existing tabs when the file is already open, or creates new tabs as needed.
  - Added **NAB-XLF-Translator agent** for translating Business Central AL XLF localization files. This specialized agent provides comprehensive instructions for app discovery, language code derivation from filenames, and a structured translation workflow with quality controls. The agent facilitates the entire translation process from AL compilation to final summary tables, ensuring terminology consistency and adherence to Business Central UI standards. Also includes a `translateXlfFiles` prompt file that works with the agent to provide an intuitive translation interface for users.
  - Added new command line parameters to `RefreshXLF.js` for improved CI/CD integration, particularly GitHub Actions workflows:
    - `--github-message`: Formats output as GitHub Actions workflow commands (::warning:: and ::error::) for better integration with GitHub Actions. When combined with `--check-only`, produces simplified single-line output per file. Without `--check-only`, produces detailed single-line output including translation statistics.
    - `--fail-changed`: Returns exit code 1 if any XLF files are modified during refresh, useful for validation workflows.
    - `--check-only`: Performs dry-run validation without modifying any XLF files. Validates translation status and reports what would change, but leaves all files untouched. This is particularly useful for CI/CD pipelines, pre-commit hooks, and automated workflows where read-only verification is needed. Cannot be combined with `--update-g-xlf`.
- Changed:
  - Updated dependencies.
- Fixes:
  - Fixed an issue where the XLIFF cache was not cleared when LLM tools (Language Model Tools in GitHub Copilot Chat) modified XLF files. This caused hover text translations to show old information after translations were saved using tools like `saveTranslatedTexts`, `refreshXlf`, or `createLanguageXlf`. The cache is now properly cleared after these tools modify files, ensuring hover text displays the most recent translations. Fixes <a href="https://github.com/jwikman/nab-al-tools/issues/530">issue 530</a>.
  - Fixed an issue where translation units with empty targets but non-empty sources were not marked as needing translation when refreshing XLF files from g.xlf. Empty targets are now properly detected and marked according to the translation mode: in NAB tags mode, the target is set to `[NAB: NOT TRANSLATED]`; in external or DTS mode, the target state is set to `needs-translation`. This prevents accidentally missing translations that were deleted or left blank. Fixes <a href="https://github.com/jwikman/nab-al-tools/issues/552">issue 552</a>. Thanks to <a href="https://github.com/vecchiotom">@vecchiotom</a> for reporting this.

## [1.44]

- Added:
  - Publish NAB AL Tools MCP Server to npm registry as `@nabsolutions/nab-al-tools-mcp`. This enables easy installation and usage of the MCP server in various MCP clients, such as GitHub Copilot Coding agent and Claude Desktop. See [@nabsolutions/nab-al-tools-mcp](https://www.npmjs.com/package/@nabsolutions/nab-al-tools-mcp) for details.
  - New setting: `NAB.RemoveTranslationCommentsAfterUse`. Removes translation comments from AL code after they have been applied to the XLIFF file during refresh/update. Can be used when translations in comments has been activated by `NAB.LanguageCodesInComments`. Helps keep AL code clean after the translation in comments have been used. Thanks to [@hhfiddelke](https://github.com/hhfiddelke) for suggesting this in [issue 506](https://github.com/jwikman/nab-al-tools/issues/506).
- Changed:
  - **Breaking Change for Language Model Tools**: Updated `toolReferenceName` values for all Language Model Tools to match the tool name without the `nab-al-tools-` prefix. This change aligns with how tools are now referenced in instruction and prompt files, improving consistency with GitHub Copilot's expectations and the broader tooling ecosystem. The new reference names are: `refreshXlf`, `getTextsToTranslate`, `getTranslatedTextsMap`, `getTextsByKeyword`, `getTranslatedTextsByState`, `saveTranslatedTexts`, `createLanguageXlf`, and `getGlossaryTerms`.
  - As a consequence of the new setting `NAB.RemoveTranslationCommentsAfterUse`, the `NAB: Refresh XLF files from g.xlf` function now keeps translations in comments as default. Enable `NAB.RemoveTranslationCommentsAfterUse` to use the old behavior of removing translations from comments after the refresh.
  - **Breaking Change for MCP Server**: Refactored MCP server initialization to use global state management. The MCP server now requires initialization before other tools can be used:
    - Added mandatory `initialize` tool that sets up global state
    - All MCP tools now require the server to be initialized first, improving reliability and error handling
    - Enhanced API documentation with clearer descriptions for pagination behavior and workspace file usage
  - **Enhanced Translation Progress Tracking**: The `getTextsToTranslate` tool (both Language Model Tool and MCP Server) now returns additional count information:
    - `totalUntranslatedCount`: Total number of untranslated texts in the file
    - `returnedCount`: Number of texts returned in the current batch
    - This provides better visibility into translation progress and remaining work for LLMs and agents
  - **Enhanced Translation Propagation**: The `saveTranslatedTexts` tool (both Language Model Tool and MCP Server) now automatically propagates translations to other translation units with matching source text:
    - When saving a translation with target state `undefined`, `translated`, `final`, or `signed-off`, the translation is automatically copied to all matching translation units
    - For DTS/External mode (when `useTargetStates` is enabled): Only propagates to units with state `needsTranslation`, `new`, or empty
    - For NAB Tags mode: Only propagates to units with token `[NAB: NOT TRANSLATED]` or empty units, preserving all in-progress review work
    - Respects all translation settings including `autoAcceptSuggestions`, `setExactMatchToState`, and `exactMatchState`
    - This significantly improves translation efficiency by automatically maintaining consistency across repeated text
- Fixes:
  - Fixed a regression where labels with `Locked=true` were not being removed from `*.g.xlf` files when running `NAB: Update g.xlf`. Thanks to [@hhfiddelke](https://github.com/hhfiddelke) for reporting this in [issue 527](https://github.com/jwikman/nab-al-tools/issues/527).
  - Fixed an issue in XML formatting where multiple spaces in XML text content (such as developer notes in XLIFF files) were incorrectly collapsed to single spaces. The XML formatter now preserves whitespace in text nodes while still normalizing spacing within XML tags and attributes.
  - Fixed an issue where parsing of AL objects failed when there was trailing whitespace after the object name. Thanks to [@lv-janpieter](https://github.com/lv-janpieter) for reporting this in [issue 529](https://github.com/jwikman/nab-al-tools/issues/529).

## [1.42]

- Added:
  - Added `NAB.PreserveOriginalAttribute` setting: When enabled, the 'original' attribute in translated XLIFF files will match the 'original' attribute from the source .g.xlf file (e.g., 'MyApp'). When disabled (default), the 'original' attribute will include the .g.xlf file extension (e.g., 'MyApp.g.xlf') for compatibility with some external translation services. Enable this setting if you're using translation tools like Crowdin that require matching 'original' attributes between source and target files. Fixes [issue 294](https://github.com/jwikman/nab-al-tools/issues/294).
  - Added new Language Model Tools for improved translation workflow in GitHub Copilot Chat:
    - `nab-al-tools-getTextsByKeyword` — Search source or target texts by keyword or regex to review terminology and locate related units. By default searches source (includes untranslated); when `searchInTarget` is true, searches only target (excludes untranslated).
    - `nab-al-tools-createLanguageXlf` — Create new XLF files for target languages based on generated XLF files, with optional base app translation matching.
  - `nab-al-tools-getGlossaryTerms` — Return Business Central glossary term pairs for a target language (optional source language), to enforce consistent terminology during translation and review.
  - Added support for a MCP server. This enables, not only integration with GitHub Copilot Chat, but also other MCP clients like Claude Desktop or GitHub Coding Agent. See [MCP_SERVER.md](MCP_SERVER.md) for details.

## [1.40]

- Changed:
  - Improved the Model descriptions and output for the Language Model Tools.
  - Added `sourceText` as an optional parameter to `nab-al-tools-getTranslatedTextsByState`, allowing users to filter translations by source text. This helps maintain consistency, review specific UI elements, compare translations across contexts, and focus on priority content.
- Fixes:
  - All unsaved files will be saved before the `NAB: Update all XLF files` or `NAB: Update g.xlf` are being executed. Thanks to [@hhfiddelke](https://github.com/hhfiddelke) for suggesting this in [issue 506](https://github.com/jwikman/nab-al-tools/issues/506).
  - Fixed an issue where `NAB: Convert to PermissionSet object` failed with "Report X not found" error when trying to convert permission sets that referenced objects not available in the symbol references. Thanks to [@Freitagabend](https://github.com/Freitagabend) for reporting this in [issue 509](https://github.com/jwikman/nab-al-tools/issues/509).

## [1.38]

- New Features:
  - Added Language Model Tools for improved translation workflow in GitHub Copilot Chat:
    - `nab-al-tools-getTextsToTranslate`: Retrieves untranslated texts from XLF files, making it easy to identify which strings need translation work.
    - `nab-al-tools-saveTranslatedTexts`: Allows saving translated text directly from the chat interface into XLF files, maintaining proper state attributes.
    - `nab-al-tools-getTranslatedTextsMap`: Creates a map of source texts to their translations, useful for analyzing translation patterns and consistency.
    - `nab-al-tools-getTranslatedTextsByState`: Retrieves translations filtered by their translation state from XLF files, helping to identify translations in various stages such as 'needs-review', 'translated', 'final', or 'signed-off'.
    - `nab-al-tools-refreshXlf`: Refreshes XLF files from g.xlf, automatically updating translation files with new or modified source texts while preserving existing translations.
    - These tools enable a more interactive and efficient translation workflow directly within GitHub Copilot Chat, reducing the need for manual file editing.
    - These tools are considered preview features and may change in future releases.
  - Added a new setting, `NAB.documentation.includeAllProcedures`. When creating external documentation, this setting specifies if all procedures should be included. If not enabled, only public procedures will be included. Thanks to [joho-nav](https://github.com/joho-nav) for suggesting this in [issue 492](https://github.com/jwikman/nab-al-tools/issues/490)
  - Added a new setting, `NAB.documentation.includeReports`. When creating external documentation, this setting specifies if Reports should be included. If not enabled, only Reports with public (or any, if `NAB.documentation.includeAllProcedures` is enabled) procedures will be included. Thanks to [joho-nav](https://github.com/joho-nav) for reporting this in [issue 490](https://github.com/jwikman/nab-al-tools/issues/490)
  - Added a new setting, `NAB.documentation.includeXmlPorts`. When creating external documentation, this setting specifies if XmlPorts should be included. If not enabled, only XmlPorts with public (or any, if `NAB.documentation.includeAllProcedures` is enabled) procedures will be included.
  - Added a new setting, `NAB.documentation.includeQueries`. When creating external documentation, this setting specifies if Queries should be included. If not enabled, only Queries with public (or any, if `NAB.documentation.includeAllProcedures` is enabled) procedures will be included.
  - Added a new function `NAB: Create XLF with selected Source Language`. This function creates a new XLF file from one existing XLF file as source and another as target. This is useful when you want to translate between two languages that are not English.
  - Added a new function `NAB: Import Translations by Id`. This function Imports translations from a selected XLF file to the XLF file. The matching is done by the `id` attribute of the `trans-unit` element. This is useful when you want to import translations from an XLF file with another source language.
- Changes:
  - Improved feedback messages in translation operations, providing clearer status information and better distinguishing between texts needing review versus those requiring translation
- Fixes:
  - Fixes an issue where the error `Invalid Version: Exclude` is shown when generating external documentation. Thanks to [joho-nav](https://github.com/joho-nav) for reporting this in [issue 490](https://github.com/jwikman/nab-al-tools/issues/490)

## [1.36]

- New Features:
- Added a new setting, `NAB.SkipTranslationPropertyForLanguage`. This can be used if one or more translation properties should be skipped for a specific language. This is useful when you do not want to translate a specific property for a specific language. For example, if you do not want to translate ToolTips or AboutTitle/AboutText in all languages. Use the `keepTranslated` property of this setting if you want to keep the translation unit if it is already translated, or if it gets a match from another translation from BaseApp, current xlf or any other configured source. When running the app in Business Central, if a translation in the current language is missing, the text from the g.xlf file is used as fallback. This setting is used when the `NAB: Refresh XLF files from g.xlf` function is executed.

## [1.34]

- New Features:
  - Added support for namespaces in symbols.
  - Added support for System Actions on pages of type PromptDialog.
  - Added support for namespaces in AL objects.
  - Added support for ToolTips on table fields.
  - Added a new setting, `NAB.AutoAcceptSuggestions`. If enabled, the `NAB: Refresh XLF files from g.xlf` function will automatically accept the first suggestion, if any. This feature only works if `UseExternalTranslationTool` is disabled. Disabled by default. Thanks to [dirkmass](https://github.com/dirkmass) for suggesting this in [issue 470](https://github.com/jwikman/nab-al-tools/issues/470).
  - Added a new setting, `NAB.SetExactMatchToState`. Specifies that when working with the target state attributes (`NAB.UseExternalTranslationTool: true`) and this is set to a target state value, when executing the `NAB: Refresh XLF files from g.xlf` function and an exact match is found, the target state will be set to the configured state and the state-qualifier will be set to `exact-match`.
  - Added a new setting, `NAB.ClearTargetWhenSourceHasChanged`. If enabled, the target will be set to a blank value if the source has been changed when the `NAB: Refresh XLF files from g.xlf` function is being executed. The target state will be set to `needs-translation`. This is only applicable when `NAB.UseExternalTranslationTool` is enabled.
  - Added a new setting, `NAB.ignoreMissingTransUnitsOnImport`. If enabled, the `NAB: Import translations from .csv` function will ignore missing translation units. If disabled, the function will fail if a translation unit is missing in the XLF file. Thanks to [DF1229](https://github.com/DF1229) for suggesting this in [issue 474](https://github.com/jwikman/nab-al-tools/issues/474).
  - Added a new setting, `NAB.importTranslationWithDifferentSource`. If enabled, the `NAB: Import translations from .csv` function will not throw error if the source in the .csv file is different then the source in the XLIFF file. Thanks to [DF1229](https://github.com/DF1229) for suggesting this in [issue 474](https://github.com/jwikman/nab-al-tools/issues/474).
  - Added support for Control Add-Ins when generating external documentation. Thanks to [matthewmartin-nvg](https://github.com/matthewmartin-nvg) for suggesting this in [issue 477](https://github.com/jwikman/nab-al-tools/issues/477).
- Fixes:
  - Added support for captions in the `layout` of a `rendering` section in reports. Thanks to [lv-janpieter](https://github.com/lv-janpieter) for bringing us the attention to this in [issue 441](https://github.com/jwikman/nab-al-tools/issues/441).
  - Removed a couple of semicolons from the test snippets (see [this post on X](https://twitter.com/arthrvdv/status/1727729430737342791) for more information)
  - Added support for ControlAddIns
  - Added support for ToolTips on Label controls
- Changes:
  - Setting `NAB.TranslationSuggestionPaths` now supports absolute paths in addition to relative paths.

## [1.32]

- Changes:
  - Changed from Codeunit `Assert` to `"Library Assert"` in the `ttestcodeunit (NAB)` snippet. Thanks to [pri-kise](https://github.com/pri-kise) for bringing us the attention to this in [issue 434](https://github.com/jwikman/nab-al-tools/issues/434).
- Fixes:
  - Fixes an issue where labels with several single quotes in the text got half of the single quotes removed. Thanks to [FrankRensen](https://github.com/FrankRensen) for reporting this in [issue 433](https://github.com/jwikman/nab-al-tools/issues/433).

## [1.30]

- New Features:
  - The Xliff trans-unit element now supports the "approved" attribute. Thanks to [JSebastianN](https://github.com/JSebastianN) for suggesting this in [discussion 420](https://github.com/jwikman/nab-al-tools/discussions/420).
  - A new setting, `NAB.SearchReplaceBeforeSaveXliff`, is added. This specifies if one or more Regular Expression Search & Replace should be performed on the XLF file before it is being saved to disk after being modified by this extension. Eg. this would affect the result after the `NAB: Refresh XLF files from g.xlf` has been executed. Thanks to [JSebastianN](https://github.com/JSebastianN) for reporting an issue that lead to this solution in [discussion 423](https://github.com/jwikman/nab-al-tools/discussions/423).
  - Support for the new behavior of `al.packageCachePath`, that from AL Language v11.0 can be an array. Thanks to [kine](https://github.com/kine) for reporting [issue 430](https://github.com/jwikman/nab-al-tools/issues/430) that lead to this solution.

## [1.28]

- New Features:
  - The "TableNo" property of codeunits is now included when using the `NAB: Generate External Documentation` function.
  - Detection of a xlf merge conflict gone bad. See [issue 395](https://github.com/jwikman/nab-al-tools/issues/395) for details.
- Fixes:
  - Fixes an issue when running `NAB: Create AL Project from Template (preview)` with a template with renameFiles with `"transformation": ["RemoveSpaces", "LowerCase"]`. Thanks to [fvet](https://github.com/fvet) for reporting this in [issue 388](https://github.com/jwikman/nab-al-tools/issues/388).
  - Fixes an issue where Labels that had a name with double quotes was not correctly identified, causing several features to fail for that label. Ex. Hover on labels for translations, `NAB: Find translated texts of current line` and probably more. Examples on label names that now are supported is "My Label", "000MyLabel", "My ""Label""" etc. Thanks to [jhoek](https://github.com/jhoek) for reporting this in [issue 391](https://github.com/jwikman/nab-al-tools/issues/391).
  - Support for certificates with a subject name starting with anything else than `CN=`. Thanks to [vody](https://github.com/vody) for reporting this in [issue 397](https://github.com/jwikman/nab-al-tools/issues/397) and _fixing_ this in [PR 398](https://github.com/jwikman/nab-al-tools/pull/398)!

## [1.26]

- New Features:
  - The `info.json` file created by `NAB: Generate External Documentation` is updated to include `id`, `publisher`,`application`, `platform` and `runtime` from `app.json`.
- Fixes:
  - Removed variable prefixes in test snippets.
  - Fixes an issue where the provided values where reset to default if the focus was changed to another tab. This affected the WebViews used by `NAB: Create AL Project from Template (preview)` and `NAB: Convert to PermissionSet objects` ([issue 382](https://github.com/jwikman/nab-al-tools/issues/382)).
  - Improved support for Xml PermissionSets that are exported from the Web Client. Thanks to [kenmoto8](https://github.com/kenmoto8) for reporting this! ([issue 384](https://github.com/jwikman/nab-al-tools/issues/384))
    - Support for `TenantPermissions` elements
    - Support for permissions on `System`
    - Support for names instead of numbers in `ObjectType`
    - Support for `Yes` and `Indirect` instead of numbers for the different permissions
    - Support for missing permission elements

## [1.24]

- New Features:
  - Some additions has been done to `NAB: Generate External Documentation`:
    - Links to other object pages are now added also for return types of object type.
    - In API pages with sub pages, a link to the sub page is added.
    - New settings:
      - `NAB.documentation.api.IncludeDataType`: When creating external documentation, this setting specifies if the data types of fields on API pages should be included. The Data Type will only be available if the field source is a table field or a global variable.
      - `NAB.documentation.yamlTitle.enabled`: When creating external documentation, this setting specifies if a title should be created in a Yaml Header in each generated md file.
      - `NAB.documentation.yamlTitle.prefix`: When creating external documentation, this setting specifies a prefix to the YAML title created in the Yaml Header in each generated md file. This settings is only used if the `NAB.documentation.yamlTitle.enabled` setting is enabled. The special containers `{appName}`, `{publisher}` and `{version}` can be used in this setting, they will be replaced by the values from app.json when the title is created.
      - `NAB.documentation.yamlTitle.suffix`: When creating external documentation, this setting specifies a suffix to the YAML title created in the Yaml Header in each generated md file. This settings is only used if the `NAB.documentation.yamlTitle.enabled` setting is enabled. The special containers `{appName}`, `{publisher}` and `{version}` can be used in this setting, they will be replaced by the values from app.json when the title is created.
  - `NAB: Create AL Project from Template (preview)` supports a maximum length for a mapping in the `al.template.json` file. This will make sure the user does not enter to many characters in an input field.
  - `NAB: Create AL Project from Template (preview)` supports specifying `postConversionTasks` in the `al.template.json` file. The commands specified will we executed as the last step in in the conversion process or after reload of VS Code.
  - `NAB: Report Issue` a shortcut to initiate an issue with VS Code's Issue Reporter.
- Fixes:
  - Fixed a bug in the `UpgradePermissionSet()` function generated by `NAB: Convert to PermissionSet objects`. Check [issue 379](https://github.com/jwikmannab-al-tools/issues/379) for details.
    - This above fix also does a better job of keeping the SystemId's on the updated tables. Due to the messy code in this area, we cannot keep the SystemId on "Access Control" records that are generated from "User Group", since they are handled by the Base Application. Thanks to [MODUSCarstenScholling](https://github.com/MODUSCarstenScholling) for reporting this! ([issue 341](https://github.com/jwikman/nab-al-tools/issues/341))
  - Fixed a bug where the `NAB: Create AL Project from Template (preview)` failed if there where brackets (`[` or `]`) in the folder or file names. Thanks to [Joriek](https://github.com/Joriek) for reporting this issue! ([issue 343](https://github.com/jwikman/nab-al-tools/issues/343))
  - Fixed a issue where the `NAB: Create AL Project from Template (preview)` did not render special characters (as < and >) in the description or example fields.
  - Improved identification of curly bracket to better handle code like:
    - `modify("My Field") { Visible = true; }`
    - `modify("My Field") { Visible = true; } // My Comment`

## [1.22]

- New features:
  - Permission Sets are now included when running `NAB: Generate External Documentation`. All Permission Sets that are `Assignable` are included with any provided XmlComments.
  - When running `NAB: Generate External Documentation` and parameters on a procedure page is of an object data type that is a public object in the current app, a link is added that points to that object.
  - When creating documentation for a page with a system table as SourceTable, the field name is being used as fallback if the field is missing a caption.
- Fixes:
  - Fixed bug in `NAB: Refresh XLF files from g.xlf` where notes highlighting empty sources were not exported. Big thanks to [phenno1](https://github.com/phenno1) for reporting this in [issue 333](https://github.com/jwikman/nab-al-tools/issues/333).
  - Added support for parameters with a data type like `List of [Dictionary of [Integer, Code[20]]]`
- New settings:
  - `NAB.PreferLockedTranslations` Specifies if \"NAB: Refresh XLF files from g.xlf\" should be opinionated about locked translations e.g. when both source and target consists of only whitespace.
  - `NAB.TranslationFilenamePattern` Specifies a filename pattern for the translation xliff files. This could be useful to change if the Translation folder contains translations for other apps. The default pattern is "\*.xlf".

## [1.20]

- New features:
  - `NAB: Create PermissionSet for all objects` - Creates a new AL file with a PermissionSet object. This PermissionSet object includes all objects in the current workspace folder. All objects are added with the "X" permissions. All tables are also added as TableData with "RIMD" permissions. Thanks to [kristerwiklund](https://github.com/kristerwiklund) for the feature suggestion! ([issue 322](https://github.com/jwikman/nab-al-tools/issues/322))
  - Added support for the PermissionSet Extension object. Thanks to [Easystep2](https://github.com/Easystep2) for reporting that this was missing! ([issue 330](https://github.com/jwikman/nab-al-tools/issues/330))
  - Improved the feature `NAB: Create AL Project from Template (preview)` by adding support for text transformation through the `transformation` property on `placeholderSubstitutions` and `renameFiles`.
    - The properties `replaceSpaces` and `replaceSpacesWith` is now removed, since the new feature more or less makes them obsolete.
    - If more than one transformation is configured, they will be applied one at a time, top down.
    - The following transformations are currently supported:
      - RemoveSpaces (Just removes all spaces)
      - CamelCase (<https://en.wikipedia.org/wiki/Camel_case>)
      - KebabCase (<https://en.wikipedia.org/wiki/Letter_case#Kebab_case>)
      - LowerCase (all lowercase)
      - SnakeCase (<https://en.wikipedia.org/wiki/Letter_case#Snake_case>)
      - StartCase (<https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage>)
      - UpperCase (ALL UPPERCASE)
  - Added support for the `al.packageCachePath` setting when symbols are being read. Thanks to [MODUSCarstenScholling](https://github.com/MODUSCarstenScholling) for reporting this! ([issue 335](https://github.com/jwikman/nab-al-tools/issues/335))
- Fixes:
  - Fixed an issue where `Obsolete` properties on table fields was interpreted as `Obsolete` properties on the table object.
  - Improved parsing of Enum values that are written on a single line with captions, comments and all. Thanks to [MisterTrojan](https://github.com/MisterTrojan) for reporting this! ([issue 326](https://github.com/jwikman/nab-al-tools/issues/326))
  - Improved identification of PermissionSet XML Files, when they are using namespaces.
  - Fixed some unhandled errors reported by telemetry.
  - Support for converting a permission set in an app that is not the first folder in the workspace. Thanks to [MODUSCarstenScholling](https://github.com/MODUSCarstenScholling) for reporting this! ([issue 334](https://github.com/jwikman/nab-al-tools/issues/334))

## [1.18]

- New features:
  - When running `NAB: Generate External Documentation` an index file is created if the new setting `NAB.documentation.output.indexFile` is enabled. The setting `NAB.documentation.output.indexFileDepth` specifies how many levels of the Table Of Content files that should be used in the index file. The setting `NAB.CreateTocFilesForDocs` must be enabled, otherwise no index file is created, since the index file is created from the Table Of Content (TOC) files.
    - By changing the setting `NAB.documentation.output.indexFilePath` you can give the specify the name of the index file (default `index.md`) and where it should be saved (default in the `Docs` folder).
  - Added support for [Views](https://docs.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-page-object#views) to Pages and Page Extensions. Thanks to [NKarolak](https://github.com/NKarolak) for bringing this to our attention ([issue 288](https://github.com/jwikman/nab-al-tools/issues/288)).
  - Improved the feature `NAB: Create AL Project from Template (preview)` by adding support for the property `hidden` to a mapping. With that enabled, the mapping won't be showed for the user and the default value will be used. Thanks to [fvet](https://github.com/fvet) for suggesting this in [issue 275](https://github.com/jwikman/nab-al-tools/issues/275).
- Fixes:
  - Fixed an issue where Tables and Fields with `ObsoleteState = Removed` was included in the "External Documentation" ([issue 287](https://github.com/jwikman/nab-al-tools/issues/287)).
  - Fixed an issue with `NAB: Convert to PermissionSet object` if there was no AppSourceCop.json in the app folder. Thanks to [That NAV guy](https://thatnavguy.wordpress.com/2022/02/18/converting-bc-permissionset-xml-to-permissionset-object/) for getting this to our attention ([issue 290](https://github.com/jwikman/nab-al-tools/issues/290)).
  - Improved the parsing of procedures quite a lot. Now all procedures in the Base Application and the System App is successfully identified. Thanks to [NKarolak](https://github.com/NKarolak) for reporting in [issue 292](https://github.com/jwikman/nab-al-tools/issues/292).
  - Fixed an issue where the `NAB: Create AL Project from Template (preview)` command didn't replace texts inside folders that started with a dot (.). Thanks to [fvet](https://github.com/fvet) for reporting this in [issue 303](https://github.com/jwikman/nab-al-tools/issues/303).
  - Fixed the object type casing in the PermissionSet object generated by `NAB: Convert to PermissionSet object`.

## [1.16]

- New features:
  - `NAB: Renumber AL objects` renumbers all AL objects in the currently open project according to the idRanges in app.json.
  - New cli function `RefreshXLF.js` invokes `NAB: Refresh XLF files from g.xlf` and optionally `NAB: Update g.xlf`. See README for details. Want to see more functions enabled for command line/pipeline? Comment on [issue 158](https://github.com/jwikman/nab-al-tools/issues/158) while it's still open (or just create a new issue).
  - New feature `NAB: Create AL Project from Template (preview)` that uses a template settings file (named `al.template.json`) to create an AL Project from a Template Project. This is currently released as a "public preview" feature, and the functionality or naming can be changed.
    - The user is prompted to supply input values
    - The `al.template.json` supports a few features:
      - Perform "Search & Replace" within files
      - Rename files
      - Create xlf files
  - Added three new snippets for GIVEN/WHEN/THEN comments in tests.
- Changes:
  - The default value for `NAB.RefreshXlfAfterFindNextUntranslated` is changed to `true`. This means that if the functions `NAB: Set Translation Unit to "..." (Ctrl+Alt+Q)` or `NAB: Find next untranslated text (Ctrl+Alt+U)` does not find any trans-units in need of action, the XLF files are automatically refreshed and the search is run again. This also means that you do not need to call `NAB: Refresh XLF files from g.xlf` explicit, just use the `Ctrl+Alt+U` shortcut to first refresh the XLF files and directly find the first trans-unit in need of action.
- Fixes:
  - Activating "Use External Translation Tool" did not work after v0.6, this is now fixed. See [issue 251](https://github.com/jwikman/nab-al-tools/issues/251) for details.
  - Calls to CreateDocumentation.js fails in v1.14, this is now fixed. See [issue 257](https://github.com/jwikman/nab-al-tools/issues/257) for details.
  - "Find next untranslated failed with error: Cannot read property 'getElementsByTagName' of undefined". See [issue 261](https://github.com/jwikman/nab-al-tools/issues/261) for details.

## [1.14] - 2022-01-13

- New features:
  - `NAB: Copy all <source> to untranslated <target>`
    - Copies the content of the \<source\> element to the \<target\> element for all translation units that is untranslated. All copied targets are optionally marked for review.
    - This might be useful if your code that was converted from C/AL contained only translated texts, with no ENU (en-US) translation. After this has been done, all texts in source code can be changed to english over time. See [issue 243](https://github.com/jwikman/nab-al-tools/issues/243) for details.
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
  - A few additions has been made to the generated External Documentation (created from the `NAB: Generate External Documentation`):
    - Inline code tags is now supported.
      - The `<code>` element is considered an inline code if there is a non-whitespace character on the line before the `<code>` tag and the `<code>` and `</code>` are on the same line.
        - `/// This is an <code>inline</code> code`
      - The `<code>` element is considered an code block if the `<code>` tag is on the beginning of the line.
        - `/// <code>This is a code block</code>`
    - Code blocks in XmlComments now supports a language attribute
      - Add the attribute `"language"` (or `"lang"` as a shorthand) to the `code` element
        - Examples:
          - `<code lang="json">{code: "theCode"}</code>`
          - `<code language="al">Message('Hello World!');</code>`
      - If no language attribute is used, `al` will be used as the default language.
        - To enable `al` in [highlight.js](https://highlightjs.org/), <https://github.com/microsoft/AL/blob/main/highlightjs_al/dist/al.min.js> can be used.
      - The language attribute is ignored for inline code.
    - Fields and Sub Pages are printed on API pages and WebServices pages.
    - The first line of the XmlComment `Summary` is now printed for table fields and page controls (Fields, Actions, Parts).
- Changes:
  - A change has been made to the generated External Documentation (created from the `NAB: Generate External Documentation`):
    - The procedure signatures now gets the default language `al`. See above for info on highlight.js.
  - The default setting for `NAB.IncludeTablesAndFieldsInDocs` is changed to `true`
- Fixes:
  - Handle double double quotes in control names. See [issue 248](https://github.com/jwikman/nab-al-tools/issues/248) for details.

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
  - When a source is not found when using `NAB: Find source of current Translation Unit` (F12) in an XLF file, due to a missing caption or removed control, an error was shown that no code could be found. See [issue 218](https://github.com/jwikman/nab-al-tools/issues/218) for details. This is now changed so that it tries to find the closest parent that exists. So if a caption for a table field is missing, the field is shown. If a page field is completely removed, the page is shown, etc. This is especially useful if using the `GenerateCaptions` feature. Thanks to [@DavidFeldhoff](https://github.com/DavidFeldhoff) for finding this and proposing a solution, writing tests etc. Very much appreciated!

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
  - When using the function findTranslatedTexts from some \*.al file in Base Application, then it fails with breaking error "Files above 50MB cannot be synchronized with extensions.". This is now fixed in [PR 157](https://github.com/jwikman/nab-al-tools/pull/157) by [zabaq](https://github.com/zabcik) - thanks!
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
      - `F8` copies the target text from the line above.
      - `TAB` focus is moved between the target textarea and the complete checkbox and then the next line.
      - `Space` can be used to toggle the complete checkbox when it's in focus.
  - `NAB: Create translation XLF for new language` creates and opens a new translation file for selected target language with the option to match translations from BaseApp to get you going. The new translation file is saved as `<app-name>.<language-code>.xlf` in workspace translation folder. Note that there is no validation of the new target language code.
  - `NAB: Generate External Documentation` generates documentation that is intended to be used as an external documentation. I.e. to be read by someone that wants to extend the app by API, Web Services or with an extension. The documentation is created as [markdown](https://en.wikipedia.org/wiki/Markdown) files. The markdown files could be transformed to html files with the help of [DocFx](https://dotnet.github.io/docfx/) or other tools.
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
    - _This feature is a preview and will likely be removed in the future to be handled in the background where needed_.
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
  - Use this when positioned on a target line in an xlf file to copy the content of the \<source\> element to the \<target\> that are selected

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
