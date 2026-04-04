# Tool Output & Translation Architecture — Improvement Plan

> **Created:** 2026-04-04
> **Status:** Plan — Awaiting prioritization and implementation scheduling

## Executive Summary

Improve token efficiency and translation quality by optimizing tool output formats, introducing a subagent-based translation architecture, and reducing instruction context overhead.

---

## 1. Tool Output Format Changes

### 1.1 Glossary: Switch to TSV

**Problem:** Glossary returns 187 entries as pretty JSON (~750 lines, ~40KB).
**Solution:** Return TSV format (header + data rows).
**Impact:** ~190 lines — 75% line reduction, ~60% token reduction.

**Example output:**

```
source	target	description
Customer	Kund	A person or company that buys goods
Vendor	Leverantör	A person or company that sells goods
```

**Files to modify:**

- `extension/src/ChatTools/shared/GlossaryCore.ts` — add TSV serialization
- `extension/src/ChatTools/GetGlossaryTermsTool.ts` — use TSV output
- `extension/src/mcp/server.ts` — use TSV output for `getGlossaryTerms`

**Effort:** Low
**Risk:** Low — glossary terms don't contain tabs

---

### 1.2 Translation Tools: Compact JSON Array

**Problem:** MCP uses `JSON.stringify(data, null, 2)` — pretty-printed, high line count.
**Solution:** Compact JSON array — one object per line, valid JSON.

**Example output:**

```json
[
  {
    "id": "Table 123 - Field 456",
    "sourceText": "Customer No.",
    "comment": "...",
    "context": "..."
  },
  {
    "id": "Table 123 - Field 789",
    "sourceText": "Vendor No.",
    "comment": "...",
    "context": "..."
  }
]
```

**Implementation:** Create helper function:

```typescript
function compactJsonArray(items: unknown[]): string {
  return "[\n" + items.map((item) => JSON.stringify(item)).join(",\n") + "\n]";
}
```

**Files to modify:**

- `extension/src/mcp/server.ts` — replace 5 instances of `JSON.stringify(result.data, null, 2)`
- `extension/src/ChatTools/GetTextsToTranslateTool.ts` — already compact, verify
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — already compact, verify
- `extension/src/ChatTools/GetTranslatedTextsByStateTool.ts` — already compact, verify
- `extension/src/ChatTools/GetTextsByKeywordTool.ts` — already compact, verify

**Effort:** Low
**Risk:** Low — valid JSON, just different whitespace

---

### 1.3 Add `outputFormat` Parameter

**Problem:** Need backward compatibility and flexibility.
**Solution:** Add optional `outputFormat?: "json" | "tsv"` to tools where applicable.

**Default values:**
| Tool | Default `outputFormat` |
|---|---|
| `getGlossaryTerms` | `"tsv"` |
| `getTextsToTranslate` | `"json"` |
| `getTranslatedTextsMap` | `"json"` |
| `getTranslatedTextsByState` | `"json"` |
| `getTextsByKeyword` | `"json"` |

**Effort:** Medium
**Risk:** Low — additive, non-breaking

---

## 2. Structural Optimizations

### 2.1 Hoist `sourceLanguage` to Envelope

**Problem:** `sourceLanguage` repeated on every item (~24 chars × N items).
**Solution:** Move to envelope level. Only include per-item when it differs from envelope default.

**Before:**

```json
[
  {
    "id": "...",
    "sourceText": "Customer No.",
    "sourceLanguage": "en-US",
    "context": "..."
  },
  {
    "id": "...",
    "sourceText": "Vendor No.",
    "sourceLanguage": "en-US",
    "context": "..."
  }
]
```

**After:**

```json
{
  "sourceLanguage": "en-US",
  "items": [
    { "id": "...", "sourceText": "Customer No.", "context": "..." },
    { "id": "...", "sourceText": "Vendor No.", "context": "..." }
  ]
}
```

**Savings:** ~300 tokens per batch of 50 items.

**Files to modify:**

- `extension/src/ChatTools/shared/XliffToolsCore.ts` — update interfaces and core functions
- All tool files that serialize these interfaces
- MCP server tool handlers

**Effort:** Medium — touches data contracts
**Risk:** Medium — breaking schema change, coordinate with tool descriptions and agent prompts

---

### 2.2 Skip Empty Optional Fields

**Problem:** Fields like `comment`, `maxLength`, `alternativeTranslations`, `reviewReason` are emitted even when null/undefined/empty.
**Solution:** Only include in output when they have meaningful values.

**Note:** `JSON.stringify` already omits `undefined` properties. Verify this behavior and ensure explicit `null` values are not emitted either.

**Effort:** Low
**Risk:** Low

---

## 3. ChatTools `returnAsFile` Parameter

### 3.1 File-Based Result Delivery

**Problem:** Large tool results consume orchestrator context when the data is only needed by a subagent.
**Solution:** Add `returnAsFile?: boolean` parameter to ChatTools (not MCP).

**Behavior:**

- `returnAsFile: false` (default): Current behavior, inline content
- `returnAsFile: true`: Write result to `context.storageUri`, return only the file path

**File naming:** Deterministic based on parameters (e.g., `glossary-sv-SE.tsv`). Overwrites on repeat calls — no cleanup logic needed.

**Example response when `returnAsFile: true`:**

```
Glossary data (187 entries, sv-SE) written to: C:\Users\...\storageUri\glossary-sv-SE.tsv
```

**Files to modify:**

- `extension/src/ChatTools/GetGlossaryTermsTool.ts` — add `returnAsFile` parameter
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — add `returnAsFile` parameter
- Tool parameter interfaces and schemas

**Effort:** Medium
**Risk:** Low — additive, agent reads via `read_file`

---

## 4. Subagent Translation Architecture

### 4.1 Self-Looping NAB-XLF-Translator Subagent

**Problem:** Main agent context degrades over multiple translation batches. Glossary and samples may be truncated.
**Solution:** Orchestrator delegates translation to NAB-XLF-Translator subagent with fresh context.

**Architecture:**

```
Orchestrator
  ├── Calls getGlossaryTerms(returnAsFile: true) → gets URI
  ├── Calls getTranslatedTextsMap(returnAsFile: true) → gets URI
  ├── Plans workflow
  └── For each ~1000-text chunk:
        └── Spawns NAB-XLF-Translator subagent:
              ├── Prompt includes: glossary URI, samples URI, XLF file path
              ├── Reads glossary from URI (full, fresh context)
              ├── Reads samples from URI (full, fresh context)
              ├── Loops:
              │     ├── getTextsToTranslate(offset=0, limit=50)
              │     ├── Translates batch
              │     └── setTranslations(batch)
              │     (repeat until done or ~1000 texts processed)
              └── Returns: summary (count translated, issues)
```

**Key design decisions:**

- **No offset:** `setTranslations` marks texts as translated. Next `getTextsToTranslate(offset=0)` naturally returns the next untranslated batch.
- **Self-terminating:** When `returnedCount == 0`, the batch is done.
- **Fresh context per subagent:** Each 1000-text chunk gets a clean context with full glossary and samples.
- **Batch size:** 100 texts × 10 iterations ≈ 1000 per subagent invocation. Matches existing workflow batch size (limit=100). Estimated ~156K tokens per subagent — feasible within Claude's 200K context. Tune after testing.

**Files to modify:**

- `extension/assets/agents/NAB-XLF-Translator.agent.md` — update to support self-looping behavior
- `extension/assets/prompts/translateXlfFiles.prompt.md` — update to orchestrate subagent calls
- `extension/assets/instructions/translation-workflow.instructions.md` — update workflow description

**Effort:** High
**Risk:** Medium — subagent tool call reliability needs testing

---

## 5. Prompt & Instruction Optimization

### 5.1 Deduplication (Option A)

**Problem:** TDD workflow and documentation checklists duplicated across `copilot-instructions.md` and `nab-al-tools-agent.agent.md`.
**Solution:** Keep canonical copy in one file, reference from the other.

**Savings:** ~3-5K characters from always-loaded `copilot-instructions.md`.
**Risk:** Zero — no content lost, just consolidated.

**Files to modify:**

- `.github/copilot-instructions.md` — remove duplicated sections, add references
- `.github/agents/nab-al-tools-agent.agent.md` — keep canonical versions

---

### 5.2 Conservative Conciseness Pass (Option B)

**Problem:** Some instructions use verbose prose where compact lists would convey the same information.
**Solution:** Condense where meaning is fully preserved. Keep examples and edge case descriptions intact.

**Constraint:** Quality is highest priority. No information loss allowed.

**Files to review:**

- All instruction files, starting with the largest

**Effort:** Medium
**Risk:** Low if done conservatively

---

### 5.3 Tool Result Reading Instruction

**Problem:** Agent may not read full tool results when saved to file.
**Solution:** Add explicit instruction to translation/glossary agent prompts.

**Instruction text:**

> "When tool results are saved to a file, read the file using `read_file` with `offset=1` and `limit=2000`. If the file has more lines beyond what was returned, continue reading with `offset=2001, limit=2000` and so on until the full file is read."

**Background (from source code investigation):**
- VS Code Copilot Chat writes tool results > 8KB (default, experiment-gated) to disk as `content.json`/`content.txt`
- JSON content gets **re-prettified** with `JSON.stringify(parsed, null, 2)` before writing — compact JSON offers no benefit for disk-written files
- Non-JSON content (TSV) is written as-is to `content.txt` — TSV retains its compact format advantage
- The `read_file` tool has a hard cap of `MAX_LINES_PER_READ = 2000`
- Without explicit `offset`/`limit`, `read_file` defaults to a `tokenBudget` of 600 tokens (~800 chars), causing severe truncation
- Specifying explicit `offset=1, limit=2000` ensures the agent reads up to the maximum allowed

**Files to modify:**

- `extension/assets/agents/NAB-XLF-Translator.agent.md`
- `extension/assets/instructions/translation-workflow.instructions.md`
- `extension/assets/instructions/review-translation-workflow.instructions.md`
- `extension/assets/instructions/glossary-management.instructions.md`

**Effort:** Low
**Risk:** Low

---

## Implementation Priority

| Priority | Item                                | Effort | Impact    | Risk   |
| -------- | ----------------------------------- | ------ | --------- | ------ |
| 1        | 1.2 Compact JSON array (MCP)        | Low    | High      | Low    |
| 2        | 2.2 Skip empty optionals            | Low    | Medium    | Low    |
| 3        | 1.1 Glossary TSV format             | Low    | High      | Low    |
| 4        | 5.3 Tool result reading instruction | Low    | Medium    | Low    |
| 5        | 5.1 Instruction deduplication       | Low    | Medium    | Zero   |
| 6        | 2.1 Hoist sourceLanguage            | Medium | Medium    | Medium |
| 7        | 1.3 outputFormat parameter          | Medium | Medium    | Low    |
| 8        | 3.1 returnAsFile parameter          | Medium | High      | Low    |
| 9        | 4.1 Subagent architecture           | High   | Very High | Medium |
| 10       | 5.2 Conciseness pass                | Medium | Medium    | Low    |

**Recommended approach:** Implement items 1-5 first (all low effort, immediate gains), then tackle 6-10 as a coordinated change since they interact (format + structure + subagent architecture).

---

## Quality Gates

- [ ] All existing tests pass after format changes
- [ ] New tests for TSV serialization
- [ ] New tests for compact JSON array helper
- [ ] New tests for `returnAsFile` parameter
- [ ] Manual validation: run translation workflow end-to-end
- [ ] Verify glossary TSV output contains all 187 entries
- [ ] Verify compact JSON is valid JSON (parseable)
- [ ] CHANGELOG.md updated
- [ ] Tool descriptions updated in extension + MCP
- [ ] README.md / MCP_SERVER.md updated

---

## Open Questions — Resolved

### Q1: Subagent reliability (20 tool calls per invocation)

**Decision:** Start with 100 texts/batch × 10 iterations = 20 tool calls per subagent. Token budget estimate: ~156K tokens (feasible within Claude's 200K context). Monitor during testing and adjust. If unreliable, reduce iterations.

### Q2: Batch sizing

**Decision:** 100 texts per batch (matching existing workflow), 10 iterations per subagent (≈1000 texts). Token cost per iteration is ~13.9K tokens. Nearly identical throughput to 50×20 but with fewer tool calls.

### Q3: "Saved to file" threshold — INVESTIGATED

**Finding:** The threshold is **byte-based, not line-based**.
- Default: `8 * 1024` bytes (8KB), configured via `chat.agent.largeToolResultsToDisk.thresholdBytes`
- Both the threshold and the enabled flag are **experiment-based** (can vary by user/cohort)
- JSON content gets **re-prettified** with `JSON.stringify(parsed, null, 2)` before writing to disk
- Non-JSON (TSV) is written as-is
- Exempted: SearchSubagent, ExecutionSubagent, Memory tool results
- `read_file` has `MAX_LINES_PER_READ = 2000` hard cap
- Without explicit `offset`/`limit`, `read_file` defaults to tokenBudget of 600 tokens (~800 chars) — this explains truncation

**Source:** [`microsoft/vscode-copilot-chat` — `configurationService.ts` and `toolCalling.tsx`](https://github.com/microsoft/vscode-copilot-chat)

### Q4: MCP format parameter

**Decision:** MCP stays as-is for now. No `outputFormat` parameter, no `returnAsFile`. MCP runs as a standalone process without `context.storageUri`. Optimizations can be added later since shared core functions make it easy.
