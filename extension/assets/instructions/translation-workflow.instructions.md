---
name: translation-workflow
description: "Instructions for translating XLF files using a structured workflow with LLM assistance"
---

# XLF Translation Workflow

Translation workflow for Business Central AL XLF localization files using NAB AL Tools.

## Translation Workflow

```
BUILD APP (once for all languages):
└─ Use buildAlPackage to compile and generate .g.xlf files
   ├─ If build succeeds: Proceed with translation workflow
   └─ If build fails: Analyze detailed error information and inform user

FOR EACH language XLF file in Translations folder:
│
├─ INITIALIZATION:
│  ├─ 1. Sync: refreshXlf
│  ├─ 2. Load glossary: Check for local glossary.tsv file + getGlossaryTerms(targetLanguage)
│  └─ 3. Get samples: getTranslatedTextsMap (200-500 existing translations)
│
├─ BATCH TRANSLATION LOOP:
│  │
│  WHILE getTextsToTranslate returns > 0:
│  │
│  ├─ Fetch: getTextsToTranslate(limit=100)
│  │
│  ├─ FOR EACH text in batch:
│  │  ├─ Apply glossary terms (exact match)
  │  ├─ Preserve all technical elements (see xlf-translation-technical-rules.instructions.md)
│  │  └─ Validate: All technical elements intact
│  │
│  ├─ Save: saveTranslatedTexts(batch, targetState="translated")
│  └─ Continue immediately to next batch (no pause)
│  │
│  END WHILE
│
├─ COMPLETION:
│  ├─ Final sync: refreshXlf
│  └─ Confirm: refreshXlf reports all texts translated
│
└─ Move to next language file

END FOR
FINAL: Summary table (10 most challenging translations per language)
```

## Detailed Steps

### 1. Build App (Once)

Before starting any translation work:

1. **Build the app**: Call `buildAlPackage(appJsonPath)` with the path to the app.json file
2. **If build succeeds**: The tool returns `buildSuccess: true`. Proceed with translation workflow.
3. **If build fails**: The tool returns detailed error information including:
   - Specific file paths with errors
   - Line and column numbers for each error
   - Error codes and messages
   - Source code context (5 lines before/after each error)
   - Analyze the errors and inform the user of specific issues that need to be fixed before translation can begin
4. **Note**: The .g.xlf file is automatically updated when the build succeeds, ensuring translations work with the latest code

### 2. Per-Language Initialization

For each target XLF file:

1. **Sync with generated file**: Call `refreshXlf` to sync with the .g.xlf file
2. **Load glossary**: Follow the **Glossary Initialization** process defined in the agent file
3. **Get context samples**: Call `getTranslatedTextsMap` or `getTranslatedTextsByState` to fetch 200-500 existing translations for style reference (skip if new language)

### 3. Batch Translation Loop

Process in batches of **100 texts maximum**:

```
REPEAT until getTextsToTranslate returns zero:
  1. Fetch: getTextsToTranslate(limit=100)
  2. Translate: Apply glossary + preserve technical elements (see xlf-translation-technical-rules.instructions.md)
  3. Validate: All technical elements intact
  4. Save: saveTranslatedTexts(translations, targetState="translated")
  5. Continue immediately to next batch
END
```

### 4. Per-Language Completion

After all batches for the current language:

1. Run `refreshXlf` one final time
2. Confirm `refreshXlf` reports all texts are translated
3. Move to next language file

### 5. Translation Quality

**Technical preservation rules:** Follow all requirements defined in [xlf-translation-technical-rules.instructions.md](xlf-translation-technical-rules.instructions.md).

**Glossary application:**

- Use exact glossary terms for the target language
- Implement **longest-match strategy**: sort glossary terms by length (descending) and apply longest matches first
- Example: "Customer Ledger Entry" takes precedence over "Customer" when both are applicable

**Context usage:**

- Reference the context field (e.g., "Table Customer - Field Name - Property Caption")
- Use context to understand UI element type and apply appropriate terminology

## Batch Processing Rules

### Continuous Operation

- **Automatic progression**: After saving batch N, immediately fetch batch N+1
- **No interruptions**: Don't stop to ask permission or provide status updates
- **Only stop when**:
  - refreshXlf confirms all texts are translated (file complete)
  - User explicitly says stop
  - Tool errors block progress

### Progress Communication

- **Before each batch**: "Batch N: Fetching 100 texts, applying glossary"
- **After each batch**: "Batch N: Saved X translations. Y remain. Continuing..."
- **Keep it brief**: Optimize for speed, not verbose updates

## Multi-Language Projects

**Process sequentially**: Complete language 1 entirely before starting language 2.

- ✅ Finish Swedish (0 texts remain) → start Danish
- ❌ Don't interleave: 2 batches Swedish → 2 batches Danish → confusion

## Error Handling

### Automatic Recovery

When a tool call fails or returns unexpected results:

1. **Analyze the error**: Read the complete error message and any guidance provided
2. **Auto-retry once**: Automatically retry the failed operation with adjusted parameters if the error suggests a fix
3. **Common scenarios**:
   - `getTextsToTranslate` returns 0 but count seems wrong → Run `refreshXlf` then retry
   - `saveTranslatedTexts` fails → Verify data format, retry once
   - Tool returns fewer items than requested → Continue with what's available, check on next iteration
4. **If retry fails**: Provide diagnostic details (error message, operation attempted, parameters used) and ask for guidance

### When to Ask for Clarity

- Translation exceeds maxLength and cannot be shortened without losing meaning
- Placeholders are ambiguous or nested in unclear ways
- Tool fails twice with same parameters (after automatic retry)
- Error message is unclear or doesn't suggest corrective action

### Don't Ask About

- Whether to continue (you should continue)
- Progress summaries (keep working)
- Permission to retry failed operations (auto-retry once first)

## Anti-Patterns (Forbidden)

- ❌ Creating Python/Node.js scripts for "automation"
- ❌ Suggesting external tools (Crowdin, Lokalise, etc.)
- ❌ Creating "completion guides" or "recommended approaches"
- ❌ Bulk-translating outside NAB AL Tools
- ❌ Manually editing XLF files with generic file read/write or string-replacement operations

## Final Summary

After **all** languages complete, provide one markdown table per language **only for translations completed in this session**:

| SourceText                         | TargetText |
| ---------------------------------- | ---------- |
| (10 most challenging translations) |

Show texts with: complex placeholders, long length, heavy formatting, or significant glossary usage.

**Note**: Only include translations from the current session. If no texts were translated for a language (already fully translated), show no table for that language.

### Review Status (Important)

After completing all languages, aggregate and report the review status from each language's final `refreshXlf` call:

**For each language:**

- If any translations need review, report: "**Language (code)**: X translations need review"
- If all translations are complete, confirm: "**Language (code)**: All translations completed"

**Summary:**

- If ANY language has translations needing review: "Some translations require review. Would you like to start the Review Workflow?"
- If all complete with no review needed: "All translations completed successfully with no items needing review"

**Note**: Review status is tracked during step 4 (Per-Language Completion) and aggregated here for visibility.
