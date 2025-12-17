---
agent: NAB-XLF-Translator
description: "Translate Business Central AL XLF localization files following NAB-XLF-Translator agent workflow and quality standards."
---

# XLF Translation

Translate Business Central AL XLF localization files using the NAB-XLF-Translator agent.

The agent contains comprehensive instructions for:

- App discovery and context setup
- Language code derivation from filenames
- Build and sync workflow
- Nordic language sequencing policy
- Batch translation with quality controls
- Glossary integration and consistency

## App Discovery

**If the currently opened file is located within an AL app folder structure** (app.json in root folder), that app is the one to translate.

**If the currently opened file is not located within an AL app folder structure** (no app.json in root folder), identify which app to translate by:

1. Finding all app.json files in root folders of the currently opened workspace
2. Checking that the "features" property exists, is a non-empty array, and contains "TranslationFile" - skip apps where "features" is missing, empty, or does not include "TranslationFile", as they don't support XLF translations
3. Getting the app name from the "name" property in each qualifying app.json
4. Asking the user which app to translate

**Usage:** Simply request translation of specific XLF files or entire app repositories. The agent will handle the complete workflow from compilation to final summary tables.
