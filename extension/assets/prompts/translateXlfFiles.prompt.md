---
agent: NAB-XLF-Translator
description: "Translate Business Central AL XLF localization files following NAB-XLF-Translator workflow and quality standards."
argument-hint: "[language like Swedish or da-DK] [batch size] [file path]"
---

# XLF Translation

Translate Business Central AL XLF localization files using the NAB-XLF-Translator agent.

The agent will:

- Identify the BC app to translate (via current file context or workspace scan)
- Build the app and sync translations
- Apply glossary terms and maintain terminology consistency
- Translate in batches with quality controls
- Present final summary with challenging translations
- Offer review workflow for items needing approval

**Usage:** Simply request translation of specific XLF files or entire app repositories. The agent will handle the complete workflow from app discovery to final review.
