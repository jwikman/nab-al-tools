# XLF Translation Workflow

Translation workflow for Business Central AL XLF localization files using NAB AL Tools.

## Translation Workflow

```
BUILD APP (once for all languages):
└─ Check if al_build tool is available
   ├─ If available: al_build
   └─ If unavailable: Ask user to confirm they have built the app and updated .g.xlf files

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
│  │  ├─ Preserve placeholders (%1, %2, %3)
│  │  ├─ Preserve XML tags and markup
│  │  ├─ Respect maxLength constraint
│  │  └─ Validate: placeholders intact, no markup changes
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

1. **Check tool availability**: Verify if `al_build` tool is available
2. **If al_build is available**:
   - Call `al_build` to compile and generate the .g.xlf file
   - **If build fails**: Stop and inform the user of the failure. The most probable cause is that no file from the app is currently open in VS Code. Ask the user to open a file from the app folder (e.g., `app.json` or any `.al` file) and try again.
3. **If al_build is unavailable** (only available in Pre-release AL Language extension):
   - Ask the user: "The al_build tool is not available. Have you built your AL app recently to update the .g.xlf file? Please build your app (Ctrl+Shift+P → 'AL: Package') and confirm when ready."
   - Wait for user confirmation before proceeding
   - **Note**: The .g.xlf file must be current for translations to work properly

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
  2. Translate: Apply glossary, preserve placeholders, respect maxLength
  3. Validate: Check placeholders preserved, no markup changes
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

For each text:

- **Apply glossary**: Use exact glossary terms for the target language. When multiple glossary terms overlap, implement a deterministic **longest-match strategy**: sort glossary terms in descending order of term length (by words or characters) and attempt to match/apply them in that order, so multi-word phrases like "Customer Ledger Entry" take precedence over shorter terms such as "Customer" when both are applicable.
- **Preserve placeholders**: %1, %2, %3 must remain unchanged
- **Respect maxLength**: If specified, ensure translation fits
- **Maintain formatting**: Keep XML tags, punctuation, capitalization patterns
- **Use context**: Reference type field (e.g., "Table Customer - Field Name - Property Caption")

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
