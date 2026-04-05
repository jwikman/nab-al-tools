# Tool Output & Translation Architecture — Work Plan

> **Status:** Ready
> **Created:** 2026-04-05
> **Last Updated:** 2026-04-05
> **Build command:** `npm run webpack` (from `extension/`)
> **Test command:** `npm run test` (from `extension/`, use `xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npm run test` for headless)
> **Lint command:** `npm run lint` (from `extension/`)
> **Units:** 0/10 completed

## Summary

Improve token efficiency and translation quality in NAB AL Tools by optimizing tool output formats (compact JSON, TSV, envelope structure), adding format selection and file-based output parameters, restructuring the translation subagent for self-looping with fresh context, and reducing instruction overhead through deduplication and conciseness. All 10 items from the design document are in scope, implemented in two phases: low-effort items first (Units 1-3), then coordinated medium/high-effort changes (Units 4-9).

**Scope:** All 10 items from `.aidocs/plan-tool-output-and-translation-architecture.md` (design doc).

**Out of scope:**

- MCP `outputFormat` or `returnAsFile` parameters (MCP runs standalone without `context.storageUri`)
- Changes to `setTranslations`/`saveTranslatedTexts` output format (input-only tool)
- Core function interface changes for `sourceLanguage` hoisting (serialization-layer change only)

## Context & References

- Design document: `.aidocs/plan-tool-output-and-translation-architecture.md`
- Core modules: `extension/src/ChatTools/shared/XliffToolsCore.ts`, `extension/src/ChatTools/shared/GlossaryCore.ts`
- MCP server: `extension/src/mcp/server.ts`
- ChatTool wrappers: `extension/src/ChatTools/Get*.ts`
- Agent/instructions: `extension/assets/agents/NAB-XLF-Translator.agent.md`, `extension/assets/instructions/translation-workflow.instructions.md`
- Package manifest: `extension/package.json`
- Documentation: `extension/README.md`, `extension/MCP_SERVER.md`, `extension/mcp-resources/README.md`

## Key Decisions

| #   | Decision                                            | Rationale                                                                                                                                |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Compact JSON in MCP is non-breaking                 | MCP consumers parse JSON — whitespace is irrelevant                                                                                      |
| 2   | sourceLanguage hoisting is serialization-layer only | Core interfaces (`IUntranslatedText`, `ITranslatedText`, etc.) remain unchanged; envelope wrapping happens in ChatTool/MCP serialization |
| 3   | `outputFormat` parameter only for ChatTools         | MCP runs standalone without `context.storageUri`; design doc explicitly excludes MCP from `outputFormat` and `returnAsFile`              |
| 4   | Phased approach: low-effort first                   | Items 1-5 (priority) deliver immediate gains with low risk; items 6-10 coordinate because they interact                                  |
| 5   | `returnAsFile` for ChatTools only                   | MCP server has no `context.storageUri` access                                                                                            |
| 6   | Conciseness pass preserves all information          | Quality is highest priority — no content loss allowed                                                                                    |

## Assumptions

| #   | Assumption                                                                                                                     | Status   |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1   | ChatTools use `JSON.stringify(result.data)` (compact) — only MCP uses pretty-print                                             | Verified |
| 2   | `JSON.stringify` already omits `undefined` properties — only explicit `null` needs handling                                    | Verified |
| 3   | Glossary entries don't contain tab characters                                                                                  | Verified |
| 4   | sourceLanguage is identical for all items in a batch (comes from XLF file)                                                     | Verified |
| 5   | NAB-XLF-Translator agent currently does NOT self-loop                                                                          | Verified |
| 6   | "Task Comprehension & Execution Mandate" is exactly duplicated between copilot-instructions.md and nab-al-tools-agent.agent.md | Verified |
| 7   | `context.storageUri` is not used anywhere in ChatTools currently                                                               | Verified |

## Work Units

---

### Unit 1: Compact JSON for MCP + Skip Empty Optionals

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** None

**Description:**
Create a `compactJsonArray()` helper function that serializes arrays with one JSON object per line. Replace all 5 `JSON.stringify(result.data, null, 2)` calls in mcp/server.ts with compact serialization. Verify that `undefined` properties are already omitted by `JSON.stringify` and ensure explicit `null` values are not emitted in core output objects.

**Files:**

- `extension/src/ChatTools/shared/OutputFormatUtils.ts` — **NEW**: create `compactJsonArray()` helper
- `extension/src/mcp/server.ts` — replace 5 `JSON.stringify(result.data, null, 2)` calls with `compactJsonArray(result.data)`
- `extension/src/ChatTools/shared/XliffToolsCore.ts` — verify core functions don't emit explicit `null` for optional fields; fix if needed
- `extension/src/test/ChatTools/OutputFormatUtils.test.ts` — **NEW**: tests for `compactJsonArray()` and empty-field behavior

**Pre-conditions:**

- None

**Acceptance Criteria:**

- [ ] `compactJsonArray()` produces valid JSON parseable by `JSON.parse()`
      **Type:** read-only
      **Verify:** `grep_search` for `JSON.stringify(result.data, null, 2)` in `mcp/server.ts`
      **Expected:** Zero matches (all replaced)
- [ ] Each array item is on a single line in the output
      **Type:** execution
      **Verify:** Unit test: `compactJsonArray([{a:1},{b:2}])` produces `"[\n{\"a\":1},\n{\"b\":2}\n]"`
      **Expected:** Test passes
- [ ] Empty arrays produce `"[\n]"`
      **Type:** execution
      **Verify:** Unit test
      **Expected:** Test passes
- [ ] `undefined` optional fields are not present in output
      **Type:** execution
      **Verify:** Unit test: serialize object with `comment: undefined` → field absent
      **Expected:** Test passes
- [ ] Explicit `null` values are not emitted for optional fields
      **Type:** read-only
      **Verify:** Grep for `= null` assignments in XliffToolsCore.ts output-facing code
      **Expected:** No explicit null assignments to optional output fields
- [ ] `npm run webpack` passes with zero errors
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0
- [ ] `npm run lint` passes with zero warnings
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0
- [ ] All existing tests pass
      **Type:** execution
      **Verify:** `npm run test`
      **Expected:** Exit code 0

**Output for subsequent units:**

- `compactJsonArray()` helper available in `OutputFormatUtils.ts` for reuse
- MCP server outputs compact JSON for all 5 translation/glossary tools
- No explicit nulls in core output objects

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 2: Glossary TSV Format

**Complexity:** Complex
**Status:** ⬚ Not Started
**Depends on:** Unit 1

> **Dependency rationale:** Both Units 1 and 2 modify `mcp/server.ts` (glossary handler). Unit 1 must complete first to avoid merge conflicts.

> **⚠️ BREAKING CHANGE:** This unit changes the default glossary output from JSON to TSV. Existing consumers expecting JSON will break until Unit 5 adds the `outputFormat` parameter to restore JSON access. Units 2 and 5 should be deployed together.

**Description:**
Add TSV serialization for glossary output. Glossary entries contain `source`, `target`, and `description` fields — naturally tab-safe. Create a `glossaryToTsv()` function in GlossaryCore, update `GetGlossaryTermsTool` to output TSV by default, and update the MCP server glossary handler to use TSV via the compact helper.

**Files:**

- `extension/src/ChatTools/shared/GlossaryCore.ts` — add `glossaryToTsv(entries: IGlossaryEntry[]): string` function
- `extension/src/ChatTools/GetGlossaryTermsTool.ts` — change output from `JSON.stringify(result.data)` to `glossaryToTsv(result.data)`
- `extension/src/mcp/server.ts` — update `getGlossaryTerms` handler to use `glossaryToTsv()` instead of JSON
- `extension/src/test/suite/glossaryCore.test.ts` — add tests for TSV serialization
- `extension/package.json` — update `getGlossaryTerms` `modelDescription` to mention TSV output format

**Pre-conditions:**

- None

**Acceptance Criteria:**

- [ ] `glossaryToTsv()` produces header row `source\ttarget\tdescription` followed by data rows
      **Type:** execution
      **Verify:** Unit test with known entries
      **Expected:** Output matches expected TSV format
- [ ] Empty glossary produces header-only output
      **Type:** execution
      **Verify:** Unit test with empty array
      **Expected:** Single header line
- [ ] Special characters in fields (quotes, newlines) are handled safely
      **Type:** execution
      **Verify:** Unit test with edge case data
      **Expected:** No corruption or parsing errors
- [ ] Tab characters in glossary entries are validated: reject or escape entries containing tabs
      **Type:** execution
      **Verify:** Unit test with entry containing embedded tab character
      **Expected:** Tab is escaped/replaced or error thrown — never silently corrupts TSV structure
- [ ] Agent prompts that parse glossary output are updated for TSV format
      **Type:** read-only
      **Verify:** `grep_search` for glossary parsing references in `translation-workflow.instructions.md` and `glossary-management.instructions.md`
      **Expected:** Instructions reference TSV format, not JSON
- [ ] ChatTool returns TSV format
      **Type:** execution
      **Verify:** Test or manual verification
      **Expected:** Output starts with `source\ttarget\tdescription`
- [ ] MCP server returns TSV format for glossary
      **Type:** read-only
      **Verify:** Grep for JSON.stringify in glossary handler
      **Expected:** Uses glossaryToTsv() instead
- [ ] `npm run webpack` passes with zero errors
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0
- [ ] Existing glossary tests updated for TSV output format where needed
      **Type:** read-only
      **Verify:** Review GetGlossaryTermsTool.test.ts for assertions on output format
      **Expected:** Tests assert on TSV format, not JSON
- [ ] All tests pass
      **Type:** execution
      **Verify:** `npm run test`
      **Expected:** Exit code 0
- [ ] package.json `modelDescription` updated atomically with format change
      **Type:** read-only
      **Verify:** Read getGlossaryTerms description in package.json
      **Expected:** Mentions TSV output format

**Output for subsequent units:**

- `glossaryToTsv()` available for reuse
- Glossary output is TSV by default in both ChatTools and MCP
- package.json description reflects TSV format

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 3: Instruction Updates — Reading Instructions + Deduplication

**Complexity:** Complex
**Status:** ⬚ Not Started
**Depends on:** None

> **Sizing note:** 6 files, but all are documentation-only with small additions. Fits one session comfortably.

**Description:**
Two documentation improvements combined into one unit because both are instruction-file-only changes:

**(A) Tool result reading instructions (design doc item 5.3):** Add explicit guidance to 4 instruction/agent files about reading tool results saved to disk. Include `read_file` with `startLine=1, endLine=2000` pattern and continuation for larger files.

**(B) Instruction deduplication (design doc item 5.1):** Remove the duplicated "Task Comprehension & Execution Mandate" section (9 subsections) from `.github/copilot-instructions.md`. Keep the canonical copy in `.github/agents/nab-al-tools-agent.agent.md`. Add a brief reference in `copilot-instructions.md` pointing to the agent file.

**Files:**

- `extension/assets/agents/NAB-XLF-Translator.agent.md` — add tool result reading instruction
- `extension/assets/instructions/translation-workflow.instructions.md` — add tool result reading instruction
- `extension/assets/instructions/review-translation-workflow.instructions.md` — add tool result reading instruction
- `extension/assets/instructions/glossary-management.instructions.md` — add tool result reading instruction
- `.github/copilot-instructions.md` — remove duplicated "Task Comprehension & Execution Mandate" section, add reference to agent file
- `.github/agents/nab-al-tools-agent.agent.md` — verify canonical copy is complete (read-only verification, no changes expected)

**Pre-conditions:**

- None

**Acceptance Criteria:**

- [ ] All 4 instruction/agent files contain the tool result reading guidance
      **Type:** read-only
      **Verify:** `grep_search` for `startLine=1, endLine=2000` in each file
      **Expected:** One match per file (4 total)
- [ ] "Task Comprehension & Execution Mandate" section removed from copilot-instructions.md
      **Type:** read-only
      **Verify:** `grep_search` for `Task Comprehension` in copilot-instructions.md
      **Expected:** Zero matches (or only a brief reference line)
- [ ] Reference to agent file added in copilot-instructions.md
      **Type:** read-only
      **Verify:** `grep_search` for `nab-al-tools-agent` in copilot-instructions.md
      **Expected:** At least one match (reference)
- [ ] Canonical copy in nab-al-tools-agent.agent.md is intact
      **Type:** read-only
      **Verify:** `grep_search` for `Task Comprehension` in agent file
      **Expected:** Section header present
- [ ] No information lost — all 9 subsections preserved in canonical location
      **Type:** read-only
      **Verify:** `grep_search` for each subsection header in agent file
      **Expected:** All 9 found: Requirement Extraction, Checklist Management, Execution Discipline, Coverage Mapping, Clarification Policy, Quality Gates, Performance & Safety, Proactive Adjacent Improvements, Non-Compliance Handling

**Output for subsequent units:**

- Instruction files include reading guidance for disk-saved tool results
- No duplication between copilot-instructions.md and agent file
- ~3-5K characters freed from always-loaded copilot-instructions.md

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 4: Hoist sourceLanguage to Envelope

**Complexity:** Complex
**Status:** ⬚ Not Started
**Depends on:** Unit 1

> **⚠️ BREAKING CHANGE:** This unit changes the output shape of 4 translation tools from flat arrays to envelope objects. Consumers iterating `result[]` must switch to `result.items[]`. Per-item `sourceLanguage` is removed from serialized output.

> **Schema policy:** Per-item `sourceLanguage` override is **forbidden** in the serialized envelope. All items in a batch share the envelope-level `sourceLanguage`. The core interfaces retain `sourceLanguage` per-item for internal use, but the serialization layer strips it.

**Description:**
Move `sourceLanguage` from per-item repetition to an envelope wrapper. This is a **serialization-layer change only** — core interfaces (`IUntranslatedText`, `ITranslatedText`, `ITranslatedTextWithState`) remain unchanged. Create a helper function that extracts `sourceLanguage` from the first item, strips it from all items, and wraps in an envelope `{ sourceLanguage, items: [...] }`. Update all ChatTool and MCP serialization points to use the envelope.

Affected tools (4 of 5 — glossary has no sourceLanguage):

- `getTextsToTranslate` — special case: already has envelope-like structure (`IUntranslatedTextsResult` with `totalUntranslatedCount`, `returnedCount`, `texts[]`). **Design decision:** Add `sourceLanguage` as a new top-level field to the existing envelope object, then strip `sourceLanguage` from each item in the `texts[]` array. Result: `{ sourceLanguage: "en-US", totalUntranslatedCount: 50, returnedCount: 10, texts: [{id, sourceText, comment?, maxLength?, context}] }`
- `getTranslatedTextsMap` — wrap flat array in envelope `{ sourceLanguage, items: [...] }`
- `getTranslatedTextsByState` — wrap flat array in envelope `{ sourceLanguage, items: [...] }`
- `getTextsByKeyword` — wrap flat array in envelope `{ sourceLanguage, items: [...] }`

> **Sizing note:** 8 files, but 4 ChatTool changes are near-identical (apply envelope wrapper at serialization point). **Split guidance:** If session overflows, split into (a) helper + 4 ChatTools + tests, (b) MCP + package.json.

**Files:**

- `extension/src/ChatTools/shared/OutputFormatUtils.ts` — add `wrapWithLanguageEnvelope()` helper
- `extension/src/ChatTools/GetTextsToTranslateTool.ts` — use envelope (add sourceLanguage to existing result structure, strip from items)
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — use envelope wrapper
- `extension/src/ChatTools/GetTranslatedTextsByStateTool.ts` — use envelope wrapper
- `extension/src/ChatTools/GetTextsByKeywordTool.ts` — use envelope wrapper
- `extension/src/mcp/server.ts` — update 4 handlers to use envelope (adapt compact serialization for envelope object)
- `extension/src/test/ChatTools/OutputFormatUtils.test.ts` — add tests for envelope helper
- `extension/package.json` — update `modelDescription` for 4 tools to describe envelope format

**Pre-conditions:**

- Unit 1 complete: `OutputFormatUtils.ts` exists with `compactJsonArray()`

**Acceptance Criteria:**

- [ ] Envelope format includes `sourceLanguage` at top level
      **Type:** execution
      **Verify:** Unit test: `wrapWithLanguageEnvelope([{sourceLanguage: "en-US", sourceText: "hi"}])` → `{sourceLanguage: "en-US", items: [{sourceText: "hi"}]}`
      **Expected:** Test passes
- [ ] Per-item `sourceLanguage` removed from serialized output
      **Type:** execution
      **Verify:** Unit test: serialized envelope items don't contain `sourceLanguage`
      **Expected:** Test passes
- [ ] Empty arrays handled: envelope with empty items
      **Type:** execution
      **Verify:** Unit test: `wrapWithLanguageEnvelope([])` → `{sourceLanguage: "", items: []}`
      **Expected:** Test passes (or appropriate fallback for missing language)
- [ ] `getTextsToTranslate` preserves `totalUntranslatedCount` and `returnedCount` alongside `sourceLanguage` in envelope
      **Type:** execution
      **Verify:** Unit test or code review
      **Expected:** All three metadata fields present at top level
- [ ] MCP envelope output is properly serialized (not using `compactJsonArray` for top-level object)
      **Type:** read-only
      **Verify:** Code review — MCP handlers use appropriate serialization for envelope + compact items
      **Expected:** Top-level object keys on separate lines, items array uses compact format
- [ ] `npm run webpack` passes
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0
- [ ] Existing tests updated for new envelope output format (ChatTool tests that assert on JSON structure)
      **Type:** read-only
      **Verify:** Review test files for GetTextsToTranslate, GetTranslatedTextsMap, GetTranslatedTextsByState, GetTextsByKeyword
      **Expected:** Tests assert on envelope structure, not flat array
- [ ] All existing tests pass
      **Type:** execution
      **Verify:** `npm run test`
      **Expected:** Exit code 0
- [ ] package.json `modelDescription` updated atomically with code changes
      **Type:** read-only
      **Verify:** Read package.json descriptions for 4 tools
      **Expected:** Descriptions mention envelope/sourceLanguage structure
- [ ] Agent prompts that read `sourceLanguage` per-item are updated to read from envelope top-level
      **Type:** read-only
      **Verify:** `grep_search` for `sourceLanguage` in agent/prompt/instruction files
      **Expected:** References point to envelope-level field, not per-item
- [ ] Integration test: ChatTool invoke → serialize → verify envelope structure end-to-end
      **Type:** execution
      **Verify:** Test creates mock data, invokes tool, parses result, checks `result.sourceLanguage` and `result.items[0]` has no `sourceLanguage`
      **Expected:** Test passes

**Output for subsequent units:**

- All translation tools output envelope format with sourceLanguage at top level
- ~300 tokens saved per batch of 50 items
- `wrapWithLanguageEnvelope()` helper available for reuse
- MCP server adapted for envelope structure

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 5: outputFormat Parameter

**Complexity:** Complex
**Status:** ⬚ Not Started
**Depends on:** Unit 2, Unit 4

**Description:**
Add optional `outputFormat?: "json" | "tsv"` parameter to tools where applicable. For glossary, default is `"tsv"` (already TSV from Unit 2); adding this parameter allows requesting JSON when needed. For translation tools, default remains `"json"`. TSV for translation tools is limited to flat structures — tools with nested arrays (`targetTexts[]`, `alternativeTranslations[]`) may only support JSON.

ChatTools only (decision #3: MCP excluded from `outputFormat`).

> **Sizing note:** 8 files, but 4 ChatTool changes are near-identical (add parameter + format switch). **Split guidance:** If session overflows, split into (a) helper + glossary + tests, (b) 4 translation tools + package.json.

**Files:**

- `extension/src/ChatTools/shared/OutputFormatUtils.ts` — add format selection utility (e.g., `serializeOutput(data, format)`)
- `extension/src/ChatTools/GetGlossaryTermsTool.ts` — add `outputFormat` parameter, implement format switching
- `extension/src/ChatTools/GetTextsToTranslateTool.ts` — add `outputFormat` parameter (JSON default, TSV implementation for flat structure)
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — add `outputFormat` parameter (JSON default)
- `extension/src/ChatTools/GetTranslatedTextsByStateTool.ts` — add `outputFormat` parameter
- `extension/src/ChatTools/GetTextsByKeywordTool.ts` — add `outputFormat` parameter
- `extension/package.json` — add `outputFormat` to tool schemas and `modelDescription`
- `extension/src/test/ChatTools/OutputFormatUtils.test.ts` — add tests for format selection

**Pre-conditions:**

- Unit 2 complete: `glossaryToTsv()` exists
- Unit 4 complete: envelope wrapper exists

**Acceptance Criteria:**

- [ ] `getGlossaryTerms` with `outputFormat: "json"` returns JSON
      **Type:** execution
      **Verify:** Unit test
      **Expected:** Output is valid JSON, not TSV
- [ ] `getGlossaryTerms` with `outputFormat: "tsv"` (or default) returns TSV
      **Type:** execution
      **Verify:** Unit test
      **Expected:** Output starts with `source\ttarget\tdescription`
- [ ] Translation tools with `outputFormat: "json"` (default) return JSON envelope
      **Type:** execution
      **Verify:** Unit test
      **Expected:** Valid JSON with sourceLanguage envelope
- [ ] `outputFormat` parameter is optional in all tool schemas
      **Type:** read-only
      **Verify:** `grep_search` for `outputFormat` in package.json
      **Expected:** Present in inputSchema for applicable tools, no `required` entry
- [ ] Invalid `outputFormat` values are rejected or fall back to default
      **Type:** execution
      **Verify:** Unit test with `outputFormat: "xml"`
      **Expected:** Error or fallback to default
- [ ] Integration test: end-to-end format switching (request JSON, receive JSON; request TSV, receive TSV)
      **Type:** execution
      **Verify:** Integration test covering glossary + at least one translation tool
      **Expected:** Roundtrip parse succeeds for both formats
- [ ] `npm run webpack` passes
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0

**Output for subsequent units:**

- Tools support format selection via `outputFormat` parameter
- Glossary defaults to TSV, translation tools default to JSON
- Parameter documented in package.json schemas

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 6: returnAsFile Parameter

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** None

**Description:**
Add `returnAsFile?: boolean` parameter to ChatTools (not MCP). When `true`, tool writes result to `context.storageUri` and returns only the file path. File naming is deterministic based on parameters (e.g., `glossary-sv-SE.tsv`). Overwrites on repeat calls — no cleanup logic needed.

Initial implementation for two high-value tools: `GetGlossaryTermsTool` and `GetTranslatedTextsMapTool`. Other tools can be added later following the same pattern.

**Files:**

- `extension/src/ChatTools/GetGlossaryTermsTool.ts` — add `returnAsFile` parameter, implement file writing
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — add `returnAsFile` parameter, implement file writing
- `extension/package.json` — add `returnAsFile` to tool schemas and `modelDescription` for both tools
- `extension/src/test/ChatTools/GetGlossaryTermsTool.test.ts` — add tests for file output mode

**Pre-conditions:**

- None (additive feature)

**Acceptance Criteria:**

- [ ] `returnAsFile: true` writes result to a file under `context.storageUri`
      **Type:** execution
      **Verify:** Unit test with mocked `context.storageUri`
      **Expected:** File created at expected path
- [ ] `returnAsFile: true` returns only the file path as text (not the full data)
      **Type:** execution
      **Verify:** Unit test: returned text matches file path pattern
      **Expected:** Response is a short message with file path, not full glossary/map data
- [ ] `returnAsFile: false` (default) returns inline content (existing behavior)
      **Type:** execution
      **Verify:** Unit test
      **Expected:** Full data returned inline
- [ ] Deterministic file naming: `glossary-{targetLanguage}.tsv` for glossary
      **Type:** execution
      **Verify:** Unit test checking file name
      **Expected:** File name matches pattern
- [ ] Repeat calls overwrite existing file (no accumulation)
      **Type:** execution
      **Verify:** Unit test: call twice, verify single file exists with latest content
      **Expected:** One file with second call's content
- [ ] File lifecycle documented: files persist for the VS Code session and are overwritten on repeat calls; no explicit cleanup needed (VS Code manages `storageUri` lifecycle)
      **Type:** read-only
      **Verify:** Code review — no manual cleanup logic added; comment in code references VS Code session lifecycle
      **Expected:** No `fs.unlink` or cleanup timers for these files
- [ ] Concurrent write safety: deterministic naming prevents cross-tool conflicts; same-tool repeat writes are safe (last write wins)
      **Type:** read-only
      **Verify:** Code review — file paths include tool name and target language to avoid collisions
      **Expected:** No two tools write to the same file path
- [ ] `npm run webpack` passes
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0

**Output for subsequent units:**

- Two ChatTools support file-based output
- Pattern established for adding `returnAsFile` to other tools
- Subagent architecture (Unit 7) can reference file URIs

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 7: Subagent Translation Architecture

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** Unit 3, Unit 6

> **Dependency rationale:** Unit 3 and Unit 7 both modify `translation-workflow.instructions.md`. Unit 3 adds reading guidance first, then Unit 7 restructures for subagent architecture.

**Description:**
Update the NAB-XLF-Translator agent to support self-looping translation with fresh context per chunk. The orchestrator (prompt) calls `getGlossaryTerms(returnAsFile: true)` and `getTranslatedTextsMap(returnAsFile: true)` upfront, then spawns the subagent with file URIs. The subagent reads glossary/samples from files (full fresh context), loops `getTextsToTranslate → translate → setTranslations` until done or ~1000 texts processed, then returns a summary.

This is a documentation/instruction-only change — no production code is modified.

**Files:**

- `extension/assets/agents/NAB-XLF-Translator.agent.md` — restructure to support self-looping behavior with file-based context loading
- `extension/assets/prompts/translateXlfFiles.prompt.md` — update to orchestrate subagent calls with `returnAsFile` URIs and chunk management
- `extension/assets/instructions/translation-workflow.instructions.md` — update workflow description to reflect new architecture

**Pre-conditions:**

- Unit 6 complete: `returnAsFile` parameter available in GetGlossaryTermsTool and GetTranslatedTextsMapTool

**Acceptance Criteria:**

- [ ] Agent file describes self-looping behavior: loop `getTextsToTranslate(offset=0) → translate → setTranslations` until `returnedCount == 0`
      **Type:** read-only
      **Verify:** `grep_search` for `returnedCount` or `self-loop` in agent file
      **Expected:** Loop termination condition documented
- [ ] Prompt file orchestrates: call `getGlossaryTerms(returnAsFile: true)`, `getTranslatedTextsMap(returnAsFile: true)`, then spawn subagent with URIs
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsFile` in prompt file
      **Expected:** At least 2 matches (glossary + map calls)
- [ ] Subagent prompt includes glossary URI, samples URI, and XLF file path
      **Type:** read-only
      **Verify:** Read prompt file, verify subagent invocation template
      **Expected:** Three key pieces of context passed to subagent
- [ ] Workflow instructions describe fresh-context-per-chunk architecture
      **Type:** read-only
      **Verify:** `grep_search` for `fresh context` or `chunk` in workflow instructions
      **Expected:** Architecture explanation present
- [ ] Batch sizing documented: 100 texts × 10 iterations ≈ 1000 per subagent
      **Type:** read-only
      **Verify:** `grep_search` for `100` or `1000` in agent/workflow files
      **Expected:** Batch size guidance present
- [ ] Max-iteration guard documented: subagent stops after 15 iterations (1500 texts) with warning, preventing infinite loops
      **Type:** read-only
      **Verify:** `grep_search` for `15` or `max iteration` in agent/workflow files
      **Expected:** Guard condition documented

**Output for subsequent units:**

- Translation workflow uses subagent architecture with fresh context
- Orchestrator manages chunk boundaries
- Each subagent invocation has full glossary and sample context

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 8: Conciseness Pass

**Complexity:** Complex
**Status:** ⬚ Not Started
**Depends on:** Units 3, 7

> **Dependency rationale:** Condense AFTER deduplication (Unit 3) and structural changes (Unit 7) to avoid rework.

**Description:**
Review instruction files and condense verbose prose into compact lists where meaning is fully preserved. Start with the largest files. Keep examples and edge case descriptions intact. **No information loss allowed** — this is purely about reducing token overhead without sacrificing clarity.

**Files (enumerated, largest first):**

- `extension/assets/agents/NAB-XLF-Translator.agent.md` — review and condense (largest agent file)
- `.github/agents/nab-al-tools-agent.agent.md` — review and condense
- `.github/copilot-instructions.md` — review and condense (after Unit 3 deduplication)
- `extension/assets/instructions/translation-workflow.instructions.md` — review and condense
- `extension/assets/instructions/review-translation-workflow.instructions.md` — review and condense
- `extension/assets/instructions/glossary-management.instructions.md` — review and condense

**Target:** ≥10% character reduction per file. If a file is already concise (<2K chars), skip it.

**Pre-conditions:**

- Unit 3 complete (deduplication done first — avoids condensing text that will be removed)
- Record baseline character counts for all target files before making changes (store in Completion Notes or Session Log)

**Acceptance Criteria:**

- [ ] No information lost — every instruction, rule, and edge case preserved
      **Type:** read-only
      **Verify:** Side-by-side review of before/after for each file
      **Expected:** All rules present, just more concise
- [ ] Token savings achieved — at least 10% reduction in total instruction character count
      **Type:** read-only
      **Verify:** Character count comparison against baseline recorded in pre-conditions
      **Expected:** ≥10% reduction across modified files; per-file counts documented in Completion Notes
- [ ] Examples preserved intact
      **Type:** read-only
      **Verify:** Grep for code blocks and example sections
      **Expected:** All examples unchanged
- [ ] `npm run lint` still passes (no formatting issues in .md files)
      **Type:** execution
      **Verify:** Run command
      **Expected:** Exit code 0

**Output for subsequent units:**

- Reduced instruction token overhead
- All rules and guidance preserved in more compact form

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 9: CHANGELOG & Documentation Consolidation

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** Units 1-8

**Description:**
Consolidate all changes from Units 1-8 into documentation: CHANGELOG.md entry, verify README.md tool descriptions reflect new formats/parameters, verify MCP_SERVER.md is up to date, and verify mcp-resources/README.md usage examples are current.

**Files:**

- `extension/CHANGELOG.md` — add entries for all user-facing changes
- `extension/README.md` — verify/update tool descriptions for new formats and parameters
- `extension/MCP_SERVER.md` — verify/update tool documentation (compact JSON, TSV glossary, envelope)
- `extension/mcp-resources/README.md` — verify/update usage examples

**Pre-conditions:**

- All prior units (1-8) complete

**Acceptance Criteria:**

- [ ] CHANGELOG.md has entries for: compact JSON, glossary TSV, sourceLanguage envelope, outputFormat parameter, returnAsFile parameter, subagent architecture. Breaking changes (Units 2, 4) must be flagged with **BREAKING CHANGE:** prefix.
      **Type:** read-only
      **Verify:** Read CHANGELOG.md newest version section
      **Expected:** All 6 changes documented; breaking changes explicitly labeled
- [ ] README.md tool descriptions match actual behavior
      **Type:** read-only
      **Verify:** Cross-check tool output examples in README with actual output format
      **Expected:** Examples show current format (TSV for glossary, envelope for translation tools)
- [ ] MCP_SERVER.md documents compact JSON output and envelope structure
      **Type:** read-only
      **Verify:** `grep_search` for envelope/compact/TSV in MCP_SERVER.md
      **Expected:** Matches found for all format changes
- [ ] mcp-resources/README.md usage examples updated
      **Type:** read-only
      **Verify:** Read relevant sections
      **Expected:** Examples reflect current tool behavior
- [ ] Atomic deployment note: document that Units 2+5 and Units 4+5 must be deployed together to maintain backward compatibility
      **Type:** read-only
      **Verify:** CHANGELOG or README contains deployment note about coordinated release
      **Expected:** Note present warning against partial deployment of breaking changes

**Output for subsequent units:**

- All documentation is consistent with code changes

**Completion Notes:**

- Files modified: _(count)_
- Issues encountered: _(none / describe)_
- Deviations from plan: _(none / describe)_

---

### Unit 10: Final Review

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** All prior units

**Description:**
Cross-cutting review of all work done across prior units. Run five parallel review tracks, then apply formatting.

**Review tracks (run in parallel as subagents):**

**Track A — Mechanical checks:**

- Plan completeness: every unit status is ✅, every AC is checked off (`- [x]`)
- Orphan detection: workspace-wide grep for any deleted/renamed filenames returns zero hits (excluding plan files and design docs)
- Cross-reference integrity: modified files reference each other correctly, no broken links or stale paths

**Track B — Code quality:**

- Codebase conventions followed (naming, structure, patterns)
- No debug artifacts, TODO comments, or temporary code left behind
- Lint clean and build succeeds (if build/test commands configured)

**Track C — Holistic coherence:**

- Read the final result end-to-end as a whole, not unit-by-unit
- Identify gaps, redundancies, or inconsistencies introduced by the unit boundaries
- Verify the combined output achieves the stated goal from the plan Summary

**Track D — Dependency & conflict verification:**

- Verify all units that modified the same file did so in dependency order (no merge conflicts occurred)
- Confirm no orphaned dependencies (every "Depends on" reference points to a completed unit)
- Check critical path was efficient — flag any unnecessary serialization bottlenecks encountered

**Track E — Assumption validation:**

- Verify every assumption in the Assumptions table has status Confirmed or Verified
- Flag any unverified assumptions that remain
- Document any assumptions that turned out wrong, with resolution

**After all tracks complete:**

- Run formatting on all files modified across all units
- Consolidate findings and resolve any issues

**Files:**

- No file modifications (review only + formatting)

**Pre-conditions:**

- All prior units completed

**Acceptance Criteria:**

- [ ] Track A: all mechanical checks pass
- [ ] Track B: all code quality checks pass
- [ ] Track C: holistic review finds no gaps or inconsistencies
- [ ] Track D: all dependency checks pass
- [ ] Track E: all assumptions verified
- [ ] Formatting applied to all modified files
- [ ] Any issues found are resolved before marking unit complete
- [ ] Commit message generated covering all units
- [ ] All units have Completion Notes filled in with actual values

---

## Progress Tracking

| Unit | Title                     | Complexity | Status        | Depends On |
| ---- | ------------------------- | ---------- | ------------- | ---------- |
| 1    | Compact JSON + Skip Empty | Moderate   | ⬚ Not Started | —          |
| 2    | Glossary TSV Format       | Complex    | ⬚ Not Started | Unit 1     |
| 3    | Instruction Updates       | Complex    | ⬚ Not Started | —          |
| 4    | Hoist sourceLanguage      | Complex    | ⬚ Not Started | Unit 1     |
| 5    | outputFormat Parameter    | Complex    | ⬚ Not Started | Units 2, 4 |
| 6    | returnAsFile Parameter    | Moderate   | ⬚ Not Started | —          |
| 7    | Subagent Architecture     | Moderate   | ⬚ Not Started | Units 3, 6 |
| 8    | Conciseness Pass          | Complex    | ⬚ Not Started | Units 3, 7 |
| 9    | CHANGELOG & Documentation | Moderate   | ⬚ Not Started | Units 1-8  |
| 10   | Final Review              | Moderate   | ⬚ Not Started | All prior  |

**Status legend:** ⬚ Not Started · 🔄 In Progress · ✅ Completed · ⏸️ Blocked

**Parallel opportunities:**

- Units 1, 3, 6 can be done in parallel (no dependencies)
- Unit 2 starts after Unit 1 (shared mcp/server.ts)
- Unit 4 starts after Unit 1
- Unit 5 starts after Units 2 and 4
- Unit 7 starts after Units 3 and 6
- Unit 8 starts after Units 3 and 7
- Units 4-5 and Units 6-7 are independent chains — can run in parallel

## Session Log

| Date | Unit | Notes |
| ---- | ---- | ----- |
|      |      |       |

## Open Questions

_(None — all questions resolved during Define Phase)_

## Exploration Findings

**Architecture:**

- Core-Tool separation pattern: all business logic in `*Core.ts` modules (XliffToolsCore, GlossaryCore), reused by ChatTools and MCP
- ChatTools use `JSON.stringify(result.data)` (compact); MCP uses `JSON.stringify(result.data, null, 2)` (pretty-printed)
- MCP server has 5 pretty-print calls at approximately lines 480, 524, 577, 629, 773
- `context.storageUri` not used anywhere in ChatTools (new pattern for `returnAsFile`)

**Interfaces:**

- `IUntranslatedText`: id, sourceText, sourceLanguage, comment?, maxLength?, context
- `ITranslatedText`: sourceText, targetTexts[], sourceLanguage
- `ITranslatedTextWithState`: id, sourceText, sourceLanguage, targetText, alternativeTranslations?, comment?, translationState?, reviewReason?, maxLength?, context
- `IGlossaryEntry`: source, target, description (no language field)
- `IUntranslatedTextsResult`: totalUntranslatedCount, returnedCount, texts[] (envelope-like)

**Consumers:**

- XliffToolsCore: 7 ChatTool files, MCP server, 3 test files
- GlossaryCore: 1 ChatTool, MCP server, 2 test files

**Test coverage:**

- glossaryCore.test.ts: 5 test cases (valid data, ordering, missing columns, errors)
- GetGlossaryTermsTool.test.ts: 4 test cases (valid codes, defaults, invalid codes)
- GetTextsToTranslateTool.test.ts: exists (specific cases not enumerated)
- GetTextsByKeywordTool.test.ts: exists (specific cases not enumerated)

**Duplication:**

- "Task Comprehension & Execution Mandate" (9 subsections) exactly duplicated between `.github/copilot-instructions.md` (lines 116-195) and `.github/agents/nab-al-tools-agent.agent.md` (lines 128-198)

**Agent architecture:**

- NAB-XLF-Translator: linear workflow (not self-looping), 3 mutually exclusive modes triggered by keywords
- Prompts (translateXlfFiles, reviewXlfFiles, manageGlossary) are minimal routers, not orchestrators

## Notes

- Plan file is a living document — update as work progresses
- If a unit turns out to be too large during execution, split it and update the plan
- This plan was created from `.aidocs/plan-tool-output-and-translation-architecture.md`; use `/executeWorkPlan` to execute it
- Design doc Q4 decision: MCP stays as-is (no outputFormat, no returnAsFile) — shared core functions make future MCP enhancements easy
