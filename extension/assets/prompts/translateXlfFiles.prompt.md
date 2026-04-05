---
name: translateXlfFiles
agent: NAB-XLF-Translator
description: "Translate Business Central AL XLF localization files following NAB-XLF-Translator workflow and quality standards."
argument-hint: "[language like Swedish or da-DK] [batch size] [file path]"
---

# XLF Translation Orchestrator

Translate Business Central AL XLF localization files using the NAB-XLF-Translator agent with fresh-context-per-chunk architecture.

This prompt orchestrates the translation workflow by pre-loading reference data to files, then spawning the **NAB-XLF-Translator** subagent with file URIs. The subagent self-loops through batches of untranslated texts until complete or until reaching its iteration limit.

Full workflow details: **[Translation Workflow Instructions](../instructions/translation-workflow.instructions.md)**.

## Orchestration Steps

### Step 1: Build App

Call `buildAlPackage(appJsonPath)` to compile the app and regenerate .g.xlf files. Always build first to ensure .g.xlf is up to date.

- **Success**: Proceed to Step 2
- **Failure**: Present the detailed error info and ask the user for guidance

### Step 2: Scope Discovery & User Confirmation

For each target XLF file in the Translations folder:

1. Call `refreshXlf` to sync with the updated .g.xlf
2. Read the untranslated count from the `refreshXlf` result

Present a scope summary:

```
Translation scope:
- Eagle.sv-SE.xlf: 42 untranslated texts
- Eagle.da-DK.xlf: 150 untranslated texts
```

- **If all languages show 0 untranslated**: Report "All translations are up to date." and stop
- **Otherwise**: Ask the user to confirm before proceeding with translations

### Step 3: Pre-load Glossary

Call `getGlossaryTerms` with `returnAsFile: true` to write glossary terms to a file:

```
getGlossaryTerms(targetLanguageCode, returnAsFile: true)
→ Returns: file URI containing glossary TSV
```

If a local `glossary.tsv` exists in the Translations folder, pass it as `localGlossaryPath`.

### Step 4: Pre-load Translated Texts Map

Call `getTranslatedTextsMap` with `returnAsFile: true` to write existing translations to a file:

```
getTranslatedTextsMap(filePath, returnAsFile: true)
→ Returns: file URI containing translated texts map
```

This provides style and terminology reference for the subagent.

### Step 5: Spawn NAB-XLF-Translator Subagent

Invoke the NAB-XLF-Translator agent with the following context:

- **Glossary file URI** — from Step 3
- **Translated texts map file URI** — from Step 4
- **XLF file path** — the target translation file
- **Target language** — derived from XLF filename
- **Batch size** — 100 texts per iteration
- **Max iterations** — 15 (safety guard, ~1500 texts)

The subagent will:

1. Read glossary and translated texts from the provided file URIs
2. Self-loop: `getTextsToTranslate(offset=0, limit=100)` → translate → `saveTranslatedTexts` → repeat
3. Stop when no untranslated texts remain or max iterations reached
4. Return a summary with texts translated count and whether more remain

### Step 6: Collect Subagent Summary

Read the subagent's return summary:

- **Texts translated**: Total count from this subagent session
- **More texts remain**: Whether the subagent hit its iteration limit
- **Errors/warnings**: Any issues encountered

### Step 7: Continue If Needed

If the subagent reports `moreTextsRemain: true` (hit 15-iteration limit):

1. Re-call `getTranslatedTextsMap(filePath, returnAsFile: true)` for updated samples
2. Re-use the same glossary file URI (glossary doesn't change)
3. Spawn another NAB-XLF-Translator subagent with the same parameters
4. Repeat until the subagent reports no texts remain

Each new subagent gets a fresh context window, avoiding context exhaustion from long translation sessions.

### Step 8: Final Summary

After all subagent sessions complete for all languages:

1. Run `refreshXlf` one final time per language
2. Confirm all texts are translated
3. Present combined summary table (10 most challenging translations per language)
