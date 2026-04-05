---
name: translation-workflow
description: "Instructions for translating XLF files using a structured workflow with LLM assistance"
---

# XLF Translation Workflow

Translation workflow for Business Central AL XLF localization files using NAB AL Tools.

## Reading Tool Results

Tool results may be written to disk when they exceed ~8KB. When this happens:

1. Use `read_file` with `startLine=1, endLine=2000` to read the full content
2. If the file is larger than 2000 lines, continue with additional `read_file` calls using the next range
3. Always read the complete tool result before processing — do not rely on truncated previews

## Architecture Overview

The translation workflow uses a **fresh-context-per-chunk** architecture:

### Orchestrator (Prompt)

The `translateXlfFiles` prompt:

1. Pre-loads glossary and translated texts map to files for **all** languages (`returnAsFile: true`)
2. Spawns **one NAB-XLF-Translator subagent per language in parallel**
3. Manages multi-subagent continuation when text count exceeds ~1500 per language

### Subagent (NAB-XLF-Translator)

Each invocation handles **one language** and gets a fresh context window:

1. Reads glossary and translated texts from files (once)
2. Self-loops: `getTextsToTranslate → translate → saveTranslatedTexts → repeat`
3. Stops at max 15 iterations or when no untranslated texts remain
4. Returns summary to orchestrator

### Parallel Execution Model

- All languages are translated **simultaneously** — one subagent per language
- Each subagent operates on a **different XLF file** — no file conflicts
- Tools are safe for concurrent use: read/write operations target separate files, Node.js serializes I/O through the event loop
- After all parallel subagents return, any language with `moreTextsRemain` gets another parallel batch

### Why File-Based Loading

- **Full context** — untruncated data regardless of size
- **No tool overhead** — read once, not re-fetched per batch
- **Fresh per subagent** — clean context window each time
- **Scalable** — works for 50 or 5000 terms

### Batch Sizing

- **100 texts per iteration**
- **15 iterations per subagent** (~1500 texts max)
- **Multiple subagents** for remaining texts

## Translation Workflow

```
BUILD APP (once for all languages):
└─ Use buildAlPackage to compile and generate .g.xlf files
   ├─ If build succeeds: Proceed
   └─ If build fails: Ask user for guidance

SCOPE DISCOVERY & USER CONFIRMATION:
├─ For each language XLF file: refreshXlf → read untranslated count from result
├─ Present summary: "sv-SE: 42 untranslated, da-DK: 150 untranslated"
├─ If all languages show 0 untranslated: Report "All translations are up to date" → STOP
└─ Ask user to confirm before proceeding with translations

PRE-LOAD REFERENCE DATA (all languages in parallel):
├─ For each language (parallel tool calls):
│  ├─ getGlossaryTerms(targetLanguage, returnAsFile: true) → glossary file URI
│  └─ getTranslatedTextsMap(filePath, returnAsFile: true) → translated texts map file URI
└─ Collect all file URIs

SPAWN SUBAGENTS IN PARALLEL (all languages simultaneously):
│
├─ For each language, spawn NAB-XLF-Translator subagent with:
│  ├─ Glossary file URI (language-specific)
│  ├─ Translated texts map file URI (language-specific)
│  ├─ XLF file path, target language
│  └─ Batch size (100), max iterations (15)
│
├─ All subagents run in parallel (one per language):
│  ├─ Read glossary + samples from files (once)
│  ├─ LOOP: getTextsToTranslate(offset=0, limit=100) → translate → saveTranslatedTexts
│  ├─ Stop when returnedCount == 0 OR iteration >= 15
│  └─ Return summary (texts translated, more remain?)
│
└─ Wait for ALL subagents to return

CONTINUATION (if any language has moreTextsRemain):
│
WHILE any language reports moreTextsRemain:
│  ├─ For each such language: re-load translated texts map (updated)
│  ├─ Re-use same glossary file URIs
│  ├─ Spawn another parallel batch — only for languages with remaining texts
│  └─ Collect summaries
END WHILE

FINAL VERIFICATION:
├─ For each language: refreshXlf → confirm all texts translated
└─ Summary table (10 most challenging translations per language)
```

## Detailed Steps

### 1. Build App (Once)

1. Call `buildAlPackage(appJsonPath)` — always build first to ensure .g.xlf is up to date
2. **Success** (`buildSuccess: true`): Proceed to scope discovery
3. **Failure**: Present the detailed error info (file paths, line/column numbers, error codes, source context) and ask the user for guidance on how to proceed
4. The .g.xlf file updates automatically on successful build

### 2. Scope Discovery & User Confirmation

After a successful build:

1. For each target XLF file: call `refreshXlf` to sync with the updated .g.xlf
2. Read the untranslated count from each `refreshXlf` result
3. Present a scope summary to the user, e.g.: "sv-SE: 42 untranslated, da-DK: 150 untranslated"
4. **If all languages show 0 untranslated**: Report "All translations are up to date. Nothing to translate." and stop
5. **Ask the user to confirm** before proceeding with translations

### 3. Pre-load Reference Data (All Languages, Parallel)

For **all** target XLF files with untranslated texts (after user confirmation), pre-load reference data **in parallel**:

1. **Pre-load glossary**: `getGlossaryTerms(targetLanguage, returnAsFile: true)` → file URI per language (pass `localGlossaryPath` if local `glossary.tsv` exists)
2. **Pre-load samples**: `getTranslatedTextsMap(filePath, returnAsFile: true)` → file URI per language with 200-500 existing translations (skip for new languages)

Place all tool calls in the same call block for parallel execution.

### 4. Parallel Subagent Translation

Spawn **one NAB-XLF-Translator subagent per language simultaneously**. Place all `runSubagent` calls in the same tool-call block so they execute in parallel.

Each subagent receives glossary file URI, translated texts map URI, XLF path, target language, batch size (100), max iterations (15).

Subagent self-loops:

```
READ glossary and translated texts map from files (once at start)

iteration = 0
LOOP:
  1. Fetch: getTextsToTranslate(offset=0, limit=100)
  2. IF returnedCount == 0 → EXIT LOOP
  3. Translate: Apply glossary + preserve technical elements
  4. Validate:
     - All technical elements intact (placeholders, backslashes, punctuation, XML tags)
     - maxLength: count characters per translation; shorten if exceeds limit
     - targetText ≠ sourceText unless justified (proper noun, universal abbreviation)
  5. Save: saveTranslatedTexts(translations, targetState="translated")
  6. iteration += 1
  7. IF iteration >= 15 → EXIT LOOP with warning
  8. GOTO 1
END LOOP
```

**Key**: Always use `offset=0` — after saving translations, the untranslated set changes, so re-fetching from offset 0 ensures no texts are skipped.

### 5. Collect Summaries & Handle Continuations

After all parallel subagents return, collect each summary. If any language reports `moreTextsRemain: true`:

1. For each such language: re-call `getTranslatedTextsMap(filePath, returnAsFile: true)` for updated samples
2. Re-use same glossary file URIs (glossary doesn't change)
3. Spawn another **parallel batch** — only for languages with remaining texts
4. Repeat until all languages report no texts remaining

### 6. Final Verification

After all languages complete:

1. Run `refreshXlf` one final time per language
2. Confirm all texts are translated
3. Present combined summary

### 7. Translation Quality

**Technical preservation:** Follow [xlf-translation-technical-rules.instructions.md](xlf-translation-technical-rules.instructions.md).

**Glossary:** Use exact terms, **longest-match strategy** (sort by length descending, apply longest first).

**Context:** Reference the context field (e.g., "Table Customer - Field Name - Property Caption") for UI element type and terminology.

**Never copy source as translation:** All XLF texts are intentionally translatable (use `Locked = true` in AL to exclude). Translate every text, including technical codes. Use the `comment` field for context. If targetText equals sourceText, confirm it's genuinely the same in the target language (proper noun, universal abbreviation). If uncertain, ask the user.

## Batch Processing Rules

### Continuous Operation

- **User confirmation required** before starting translations (after scope discovery — see Step 2)
- Once confirmed, automatically progress through batches — no interruptions between batches
- **Stop only when**: refreshXlf confirms all translated, user says stop, or tool errors block progress
- **Progress format**: Before: "Batch N: Fetching 100 texts" / After: "Batch N: Saved X. Y remain. Continuing..."

## Multi-Language Projects

**Process in parallel**: All languages are translated simultaneously, one subagent per language.

- ✅ Spawn Swedish + Danish subagents in parallel → both translate concurrently
- ✅ After all return, spawn continuation subagents (parallel) for any language with remaining texts
- Each subagent operates on a separate XLF file — no conflicts

## Error Handling

### Automatic Recovery

When a tool call fails:

1. Read the complete error message
2. Auto-retry once with adjusted parameters if error suggests a fix
3. Common fixes: `getTextsToTranslate` returns 0 unexpectedly → `refreshXlf` then retry; `saveTranslatedTexts` fails → verify format, retry
4. If retry fails: provide diagnostic details and ask for guidance

### When to Ask

- Translation exceeds maxLength and can't be shortened without losing meaning
- Ambiguous or unclear placeholders
- Source text ambiguous and `comment` doesn't clarify
- Tool fails twice with same parameters

### Don't Ask About

- Progress summaries between batches, or permission to retry (auto-retry first)

## Anti-Patterns (Forbidden)

- ❌ Creating Python/Node.js scripts for "automation"
- ❌ Suggesting external tools (Crowdin, Lokalise, etc.)
- ❌ Creating "completion guides" or "recommended approaches"
- ❌ Bulk-translating outside NAB AL Tools
- ❌ Manually editing XLF files with generic file read/write or string-replacement operations

## Final Summary

After **all** languages complete, provide one markdown table per language **only for translations completed in this session** (10 most challenging: complex placeholders, long length, heavy formatting, glossary usage). Skip languages with no new translations.

### Review Status

Aggregate review status from each language's final `refreshXlf`:

- Report per language: "X translations need review" or "All completed"
- If any need review: "Some translations require review. Would you like to start the Review Workflow?"
- If all complete: "All translations completed with no items needing review"
