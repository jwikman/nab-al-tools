---
agent: NAB-AL-Translator
description: "Translate Business Central AL XLF localization files following NAB-AL-Translator agent workflow and quality standards."
---

# XLF Translation

Translate Business Central AL XLF localization files using the NAB-AL-Translator agent.

The agent contains comprehensive instructions for:
- App discovery and context setup
- Language code derivation from filenames
- Build and sync workflow
- Nordic language sequencing policy
- Batch translation with quality controls
- Glossary integration and consistency

## App Discovery

**If the currently opened file is in an AL app folder structure** (app.json in root folder), that app is the one to translate.

**If the currently opened file is NOT in an AL app folder structure** (no app.json in root folder), identify which app to translate by:
1. Finding all app.json files in root folders of the currently opened workspace
2. Checking that the "features" property (array) contains "TranslationFile" - skip apps that don't support XLF translations
3. Getting the app name from the "name" property in each qualifying app.json
4. Asking the user which app to translate

**Usage:** Simply request translation of specific XLF files or entire app repositories. The agent will handle the complete workflow from compilation to final summary tables.

