---
name: translateXlfFiles
agent: NAB-XLF-Translator
description: "Translate Business Central AL XLF localization files following NAB-XLF-Translator workflow and quality standards."
argument-hint: "[language like Swedish or da-DK] [batch size] [file path]"
---

# XLF Translation Orchestrator

Translate Business Central AL XLF localization files using the NAB-XLF-Translator agent with fresh-context-per-chunk architecture.

This prompt orchestrates the translation workflow by delegating preparation to a subagent and then spawning **one NAB-XLF-Translator subagent per language** for translation. Each subagent fetches glossary and translated texts directly, then self-loops through batches of untranslated texts until complete or until reaching its iteration limit.

Full workflow details: **[Translation Workflow Instructions](../instructions/translation-workflow.instructions.md)**.

## Important: Minimize Orchestrator Context

The orchestrator **must not** call build/refresh/glossary/textsMap tools directly. Build and refresh are delegated to a prep subagent. Glossary and translated texts map are fetched by each translator subagent at the start of its session. This keeps the orchestrator's context small, avoiding API errors caused by accumulated thinking blocks during long tool-call sequences.

**Do not** read instruction files manually — they are auto-loaded. **Do not** use the todo tool in the orchestrator — the steps are simple enough to follow sequentially. **Do not** search for files or explore the workspace — the prep subagent handles all discovery.

## Orchestration Steps

### Step 1: Preparation Subagent

**Immediately** spawn a single **NAB-XLF-Translator** subagent to handle all preparation work — do not analyze the workspace, discover apps, or resolve paths first. The prep subagent handles all discovery. The prompt must clearly state this is a **preparation-only task** (not translation).

**Subagent prompt template:**

```
## Task: Translation Preparation (NOT translation)

You are preparing translation data for the orchestrator. Do NOT translate any texts.

### Instructions
1. Build the app: call `buildAlPackage` to compile and regenerate .g.xlf files
   - If build fails: return the error details immediately
2. Find all target XLF files in the Translations folder
3. Check for a local `glossary.tsv` in the Translations folder
4. For each XLF file: call `refreshXlf` to sync with the updated .g.xlf
   - The refreshXlf result includes untranslated count — use this value directly
   - Do NOT call `getTextsToTranslate` to count untranslated texts
5. Return a JSON summary (and nothing else) in this exact format:

{
  "buildSuccess": true,
  "app": "<app name from app.json>",
  "localGlossaryExists": true/false,
  "localGlossaryPath": "<path to glossary.tsv, if exists>",
  "languages": [
    {
      "code": "sv-SE",
      "xlfPath": "<full path to XLF file>",
      "untranslatedCount": 42
    }
  ]
}

Do NOT use the todo tool. Do NOT use vscode_askQuestions. Do NOT translate any texts. Return ONLY the JSON summary.
```

**On failure** (build error): Present the error details from the prep subagent to the user and ask for guidance.

### Step 2: Scope Summary & User Confirmation

Parse the prep subagent's JSON summary and present a scope table:

```
Translation scope:
- Eagle.sv-SE.xlf: 42 untranslated texts
- Eagle.da-DK.xlf: 150 untranslated texts
```

- **If all languages show 0 untranslated**: Report "All translations are up to date." and stop
- **Otherwise**: Ask the user to confirm before proceeding with translations

### Step 3: Spawn Translator Subagents in Parallel

Invoke **one NAB-XLF-Translator subagent per language simultaneously**. Place all `runSubagent` calls in the same tool-call block so they execute in parallel.

Each subagent receives:

- **XLF file path** — the target translation file
- **Target language** — derived from XLF filename
- **Local glossary path** — path to glossary.tsv if it exists (from prep summary)
- **Batch size** — 50 texts per iteration
- **Max iterations** — 8 (safety guard, ~400 texts)

**Subagent prompt template:**

```
## Task: Translate <basename>.<lang>.xlf to <Language Name>

### MANDATORY: Load context FIRST

At the start of your session, fetch glossary and translated texts directly:

1. `getGlossaryTerms(targetLanguage="<lang>"[, localGlossaryPath="<localGlossaryPath if exists>"])`
2. `getTranslatedTextsMap(filePath="<xlfPath>", limit=500, outputFormat="tsv")`

Both results may be written to disk when they exceed ~8KB. When that happens, use `read_file(startLine=1, endLine=2000)` — if the file is larger than 2000 lines, continue with additional `read_file` calls until you have read the complete content. Do not rely on truncated previews.

Keep both results in context for the entire self-loop — do not re-fetch.

### Target
- **XLF file path**: `<xlfPath>`
- **Target language**: `<lang>` (<Language Name>)
- **Untranslated count**: <count>

### Self-Loop Instructions
1. Fetch glossary and translated texts map using the tool calls above
2. Follow the technical rules from `xlf-translation-technical-rules.instructions.md` (auto-loaded via agent instructions — do NOT search for or read it manually)
3. Self-loop: `getTextsToTranslate(filePath="<xlfPath>", offset=0, limit=50)` → translate ALL fetched texts → save ALL in one `saveTranslatedTexts` call → repeat
4. Stop when no untranslated texts remain or 8 iterations reached
5. Return a structured summary:
   - Texts translated: count
   - More texts remain: Yes/No
   - Errors: count and details
   - Warnings: list

Do NOT use vscode_askQuestions — return all issues in your summary instead.
Translate continuously — no pauses, no permission requests. Use glossary terms verbatim. Follow BC UI conventions for <Language Name>.
```

### Step 4: Collect Summaries & Handle Continuations

After all parallel subagents return, collect each summary:

- **Texts translated**: Total count from this subagent session
- **More texts remain**: Whether the subagent hit its iteration limit
- **Errors/warnings**: Any issues encountered

**If any language reports `moreTextsRemain: true`** (hit 10-iteration limit):

1. Spawn another parallel batch of subagents — only for languages that still have remaining texts
2. Each new subagent fetches fresh glossary and translated texts map at session start
3. Repeat until all languages report no texts remaining

Each new subagent gets a fresh context window, avoiding context exhaustion from long translation sessions.

### Step 5: Final Summary

After all subagent sessions complete for all languages:

1. Run `refreshXlf` one final time per language (spawn a subagent for this if multiple languages)
2. Confirm all texts are translated
3. Present combined summary table (10 most challenging translations per language)
