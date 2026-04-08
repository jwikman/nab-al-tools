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

The translation workflow uses a **fresh-context-per-chunk** architecture with a **prep-subagent pattern** to minimize orchestrator context.

### Orchestrator (Prompt)

The `translateXlfFiles` prompt keeps its context minimal by delegating preparation to a subagent:

1. Spawns a **prep subagent** (NAB-XLF-Translator) that builds and refreshes XLF files
2. Receives a compact JSON summary with untranslated counts and XLF paths
3. Asks user to confirm scope
4. Spawns **one NAB-XLF-Translator subagent per language in parallel** for translation
5. Manages multi-subagent continuation when text count exceeds ~500 per language

**Why prep subagent?** Direct tool calls (build, refreshXlf, etc.) accumulate thinking blocks and tool results in the orchestrator's context. With extended thinking models, these immutable thinking blocks can cause API errors when the context grows large before subagent spawning. The prep subagent isolates all preparation context.

### Subagent (NAB-XLF-Translator)

Each translation invocation handles **one language** and gets a fresh context window:

1. Fetches glossary and translated texts map via direct tool calls (once at session start)
2. Self-loops: `getTextsToTranslate → translate → saveTranslatedTexts → repeat`
3. Stops at max 4 iterations or when no untranslated texts remain
4. Returns summary to orchestrator

### Parallel Execution Model

- All languages are translated **simultaneously** — one subagent per language
- Each subagent operates on a **different XLF file** — no file conflicts
- Tools are safe for concurrent use: read/write operations target separate files, Node.js serializes I/O through the event loop
- After all parallel subagents return, any language with `moreTextsRemain` gets another parallel batch

### Why Per-Subagent Loading

- **Fresh context** — each subagent gets a clean context window with up-to-date data
- **No orchestrator bloat** — glossary and text map data stay out of the orchestrator's context
- **Simple architecture** — no URI indirection; subagents call tools directly
- **Scalable** — works for 50 or 5000 terms

### Batch Sizing

- **100 texts per iteration**
- **One save per fetch** — translate all fetched texts, then save in a single `saveTranslatedTexts` call
- **4 iterations per subagent** (~400 texts max)
- **Multiple subagents** for remaining texts

## Translation Workflow

```
PREPARATION SUBAGENT (spawned by orchestrator):
├─ Build app: buildAlPackage → regenerate .g.xlf
│  └─ If build fails: return error details → orchestrator asks user
├─ Find all target XLF files in Translations folder
├─ Check for local glossary.tsv
├─ For each language XLF file: refreshXlf → read untranslated count
└─ Return JSON summary: app name, per-language counts, XLF paths

ORCHESTRATOR receives compact summary:
├─ Present scope: "sv-SE: 42 untranslated, da-DK: 150 untranslated"
├─ If all languages show 0 untranslated: Report "All up to date" → STOP
└─ Ask user to confirm before proceeding

SPAWN SUBAGENTS IN PARALLEL (all languages simultaneously):
│
├─ For each language, spawn NAB-XLF-Translator subagent with:
│  ├─ XLF file path, target language
│  ├─ Local glossary path (if exists)
│  └─ Batch size (100), max iterations (4)
│
├─ All subagents run in parallel (one per language):
│  ├─ Fetch glossary + translated texts map via tool calls (once at start)
├─ LOOP: getTextsToTranslate(offset=0, limit=100) → translate ALL → save ALL in one call
├─ Stop when returnedCount == 0 OR iteration >= 4
│  └─ Return summary (texts translated, more remain?)
│
└─ Wait for ALL subagents to return

CONTINUATION (if any language has moreTextsRemain):
│
WHILE any language reports moreTextsRemain:
│  ├─ Spawn another parallel batch — only for languages with remaining texts
│  ├─ Each new subagent fetches fresh glossary and translated texts map at session start
│  └─ Collect summaries
END WHILE

FINAL VERIFICATION:
├─ For each language: refreshXlf → confirm all texts translated
└─ Summary table (10 most challenging translations per language)
```

## Detailed Steps

### 1. Preparation Subagent

The orchestrator spawns a single **NAB-XLF-Translator** subagent to handle all preparation:

1. **Build**: Call `buildAlPackage(appJsonPath)` to compile and regenerate .g.xlf files
2. **Discover**: Find all target XLF files in the Translations folder
3. **Check glossary**: Look for a local `glossary.tsv` in the Translations folder
4. **Refresh**: For each XLF file, call `refreshXlf` to sync with .g.xlf — use the untranslated count from the `refreshXlf` result (do NOT call `getTextsToTranslate`)
5. **Return JSON summary** — app name, local glossary path (if exists), per-language untranslated counts and XLF paths

The prep subagent must NOT translate any texts or use the todo tool.

### 2. Scope Summary & User Confirmation

The orchestrator parses the prep subagent's JSON summary:

1. Present scope: "sv-SE: 42 untranslated, da-DK: 150 untranslated"
2. **If all languages show 0 untranslated**: Report "All translations are up to date." and stop
3. **Ask user to confirm** before proceeding with translations

### 3. Parallel Subagent Translation

Spawn **one NAB-XLF-Translator subagent per language simultaneously**. Place all `runSubagent` calls in the same tool-call block so they execute in parallel.

Each subagent receives XLF path, target language, local glossary path (if exists), batch size (100), max iterations (4).

Subagent self-loops:

```
FETCH glossary and translated texts map via direct tool calls (once at start):
  getGlossaryTerms(targetLanguage)
  getTranslatedTextsMap(filePath, limit=250, sampling="even", outputFormat="tsv")

iteration = 0
LOOP:
  1. Fetch: getTextsToTranslate(offset=0, limit=100)
  2. IF returnedCount == 0 → EXIT LOOP
  3. Translate: Apply glossary + preserve technical elements
  4. Validate:
     - All technical elements intact (placeholders, backslashes, punctuation, XML tags)
     - maxLength: count characters per translation; shorten if exceeds limit
     - targetText ≠ sourceText unless justified (proper noun, universal abbreviation)
  5. Save ALL translations in ONE call: saveTranslatedTexts(translations, targetState="translated")
  6. iteration += 1
  7. IF iteration >= 4 → EXIT LOOP with warning
  8. GOTO 1
END LOOP
```

**Key**: Always use `offset=0` — after saving translations, the untranslated set changes, so re-fetching from offset 0 ensures no texts are skipped.

### 4. Collect Summaries & Handle Continuations

After all parallel subagents return, collect each summary. If any language reports `moreTextsRemain: true`:

1. Spawn another **parallel batch** — only for languages with remaining texts
2. Each new subagent fetches fresh glossary and translated texts map at session start
3. Repeat until all languages report no texts remaining

### 5. Final Verification

After all languages complete:

1. Run `refreshXlf` one final time per language
2. Confirm all texts are translated
3. Present combined summary

### 6. Translation Quality

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
