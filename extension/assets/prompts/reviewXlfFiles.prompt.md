---
agent: NAB-XLF-Translator
description: "Review translations needing approval in Business Central AL XLF files using NAB-XLF-Translator review workflow."
argument-hint: "[language like Swedish or da-DK] [batch size] [file path]"
---

# XLF Translation Review

Review translations that need approval in Business Central AL XLF localization files using the NAB-XLF-Translator agent.

The agent will:

- Identify the BC app and target XLF file(s)
- Fetch translations with state "needs-review-translation"
- Present items in batches (default: 10) with suggestions
- Analyze alternatives and apply glossary recommendations
- Accept user input to approve, modify, skip, or keep translations
- Save approved translations and continue until complete

**Usage:** Request review of specific XLF files or all pending review items. The agent will present batches in a clean markdown table format for easy scanning and approval.
