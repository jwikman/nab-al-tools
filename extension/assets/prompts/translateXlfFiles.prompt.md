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

### Step 3: Pre-load Reference Data (All Languages)

For **all** languages that need translation, pre-load glossary and translated texts map **in parallel**:

```
For each language (parallel tool calls):
  getGlossaryTerms(targetLanguageCode, returnAsFile: true) → glossary file URI
  getTranslatedTextsMap(filePath, returnAsFile: true)      → translated texts map file URI
```

If a local `glossary.tsv` exists in the Translations folder, pass it as `localGlossaryPath`.

### Step 4: Spawn Subagents in Parallel (All Languages)

Invoke **one NAB-XLF-Translator subagent per language simultaneously**. Place all `runSubagent` calls in the same tool-call block so they execute in parallel.

Each subagent receives:

- **Glossary file URI** — from Step 3 (language-specific)
- **Translated texts map file URI** — from Step 3 (language-specific)
- **XLF file path** — the target translation file
- **Target language** — derived from XLF filename
- **Batch size** — 100 texts per iteration
- **Max iterations** — 15 (safety guard, ~1500 texts)

Each subagent will:

1. Read glossary and translated texts from the provided file URIs
2. Self-loop: `getTextsToTranslate(offset=0, limit=100)` → translate → `saveTranslatedTexts` → repeat
3. Stop when no untranslated texts remain or max iterations reached
4. Return a summary with texts translated count and whether more remain

### Step 5: Collect Summaries & Handle Continuations

After all parallel subagents return, collect each summary:

- **Texts translated**: Total count from this subagent session
- **More texts remain**: Whether the subagent hit its iteration limit
- **Errors/warnings**: Any issues encountered

**If any language reports `moreTextsRemain: true`** (hit 15-iteration limit):

1. For each such language: re-call `getTranslatedTextsMap(filePath, returnAsFile: true)` for updated samples
2. Re-use the same glossary file URIs (glossary doesn't change)
3. Spawn another parallel batch of subagents — only for languages that still have remaining texts
4. Repeat until all languages report no texts remaining

Each new subagent gets a fresh context window, avoiding context exhaustion from long translation sessions.

### Step 6: Final Summary

After all subagent sessions complete for all languages:

1. Run `refreshXlf` one final time per language
2. Confirm all texts are translated
3. Present combined summary table (10 most challenging translations per language)
