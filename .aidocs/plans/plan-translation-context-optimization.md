# Plan: Translation Context Optimization

> **Status:** Completed
> **Created:** 2025-07-10
> **Last Updated:** 2026-04-05
> **Build command:** `npm run webpack` (from `extension/`)
> **Test command:** `npm run test` (from `extension/`, use `xvfb-run` for headless)
> **Lint command:** `npm run lint` (from `extension/`)
> **Units:** 3/3 completed

## Summary

Optimize the translation subagent's context consumption to increase translation throughput per session. Three changes: add even-spacing sampling to `getTranslatedTextsMap` (code), reduce batch count from 8×50 to 4×100 (instructions), and add thinking efficiency guidance (instructions).

**Scope:** `getTranslatedTextsMap` sampling parameter, `NAB-XLF-Translator` agent instructions, `translation-workflow` instructions, documentation.

**Out of scope:** Character budget tracking, tool-assisted budget, `saveTranslatedTexts` changes, glossary optimization, subagent architecture changes.

## Context & References

- Analysis of real Icelandic translation session (`translate_chat7.json`, ~9.8MB, 7 iterations before compaction)
- [extension/src/ChatTools/shared/XliffToolsCore.ts](extension/src/ChatTools/shared/XliffToolsCore.ts) — core `getTranslatedTextsMapCore` function
- [extension/src/ChatTools/GetTranslatedTextsMapTool.ts](extension/src/ChatTools/GetTranslatedTextsMapTool.ts) — VS Code ChatTool wrapper
- [extension/src/mcp/server.ts](extension/src/mcp/server.ts) — MCP Zod schema
- [extension/package.json](extension/package.json) — tool inputSchema
- [extension/assets/agents/NAB-XLF-Translator.agent.md](extension/assets/agents/NAB-XLF-Translator.agent.md) — translation agent
- [extension/assets/instructions/translation-workflow.instructions.md](extension/assets/instructions/translation-workflow.instructions.md) — translation workflow instructions
- [extension/MCP_SERVER.md](extension/MCP_SERVER.md) — MCP server documentation

## Key Decisions

| #   | Decision                                         | Rationale                                                                                                    |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1   | Even-spacing sampling (code change, not first-N) | Better vocabulary coverage across entire app — early translations are biased toward setup/install codeunits  |
| 2   | Batch 4×100 instead of 8×50                      | Halves iteration overhead (thinking blocks, tool call framing) while maintaining ~400 text capacity          |
| 3   | Drop character budget approach                   | Keep it simple — 4×100 already reduces context pressure; budget tracking adds complexity for marginal gain   |
| 4   | Model-agnostic design                            | Keep numbers conservative enough to work across models (not just claude-opus-4.6-fast)                       |
| 5   | Manual success measurement                       | Compare iteration counts and compaction rates in session logs before/after — no telemetry code change needed |

## Assumptions

| #   | Assumption                                                                                                     | Status                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `limit` parameter on `getTranslatedTextsMap` already works correctly                                           | Verified — code reads `limit` in pagination logic                            |
| 2   | Adding `sampling` parameter won't break existing callers (it's optional, defaults to sequential)               | Verified — new optional parameter with backward-compatible default           |
| 3   | 100 texts per batch is within model working memory for translation quality                                     | Unverified — needs validation during testing                                 |
| 4   | `translation-workflow.instructions.md` is the only instruction file referencing batch size=50 and iterations=8 | Verified — searched workspace, found references only there and in agent file |

## Background Analysis

### Context Budget Breakdown (Observed Session)

| Component                    | Size            | % of total       |
| ---------------------------- | --------------- | ---------------- |
| System prompt + instructions | 54K chars       | 11%              |
| Translated texts map (TSV)   | 38K chars       | 7.7%             |
| Glossary                     | 34K chars       | 6.9%             |
| Other initial context        | 18K chars       | 3.7%             |
| **Initial total**            | **144K chars**  | **29.3%**        |
| Per-iteration growth (avg)   | ~50K chars      | —                |
| — Thinking blocks            | ~18K chars/iter | 36% of iteration |
| — read_file (tool result)    | ~17K chars/iter | 34% of iteration |
| — saveTranslatedTexts args   | ~10K chars/iter | 20% of iteration |
| — Overhead (JSON, metadata)  | ~5K chars/iter  | 10% of iteration |
| **Total at compaction**      | **~491K chars** | 100%             |

### Combined Impact Estimate

| Change                                | Chars saved   | Extra iterations             | Complexity              |
| ------------------------------------- | ------------- | ---------------------------- | ----------------------- |
| Limit texts map to 250 (even-spacing) | ~23K          | ~0.5                         | Low (small code change) |
| Batch 4×100 (halves iteration count)  | ~100K+        | Eliminates 4 thinking blocks | None (instruction only) |
| Thinking efficiency instructions      | ~20-40K       | ~0.5-1.0                     | None (instruction only) |
| **Combined**                          | **~143-163K** | **Significant headroom**     | **Low**                 |

**Before:** 8×50, compaction at ~7-8 iterations, ~350-400 texts/session
**After (projected):** 4×100, ~400 texts with substantial context headroom

---

## Work Units

### Unit 1: Add `sampling` Parameter to `getTranslatedTextsMap`

**Complexity:** Moderate
**Status:** ✅ Completed
**Depends on:** None

**Description:**
Add an optional `sampling` parameter to `getTranslatedTextsMap` that supports `"even"` mode — when limit < total count, picks evenly-spaced entries across the full translation map instead of returning the first N. This gives the translation agent better vocabulary coverage when loading reference translations. Also fix pre-existing gap: add `outputFormat` to MCP Zod schema (already supported in ChatTools and package.json but missing from MCP).

**Algorithm specification (even-spacing):**

- Index formula: `Math.floor(i * totalCount / limit)` for `i` in `[0, limit)` — deterministic, no accumulation drift
- When `limit=0`: sampling has no effect (returns all items, existing behavior)
- When `limit >= totalCount`: sampling has no effect (all items returned sequentially)
- When `limit=1`: returns entry at index 0
- Empty map (`totalCount=0`): returns empty array
- `offset` parameter is **ignored** when `sampling="even"` — even spacing selects from the full map regardless of offset

**Files:**

- `extension/src/ChatTools/shared/XliffToolsCore.ts` — add even-spacing logic to `getTranslatedTextsMapCore`
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — add `sampling` to `ITranslatedTextsMapParameters` interface
- `extension/src/mcp/server.ts` — add `sampling` to Zod schema; also add missing `outputFormat` to Zod schema
- `extension/package.json` — add `sampling` to tool `inputSchema`
- `extension/src/test/ChatTools/GetTranslatedTextsMapTool.test.ts` — add tests for even-spacing sampling
- `extension/CHANGELOG.md` — add entry for new parameter
- `extension/MCP_SERVER.md` — document new parameter

**Pre-conditions:**

- Current tests pass (`npm run test`)
- Current build succeeds (`npm run webpack`)

**Acceptance Criteria:**

- [ ] `sampling` parameter added to `ITranslatedTextsMapParameters` as optional string (`"even"` | undefined)
      **Type:** read-only
      **Verify:** `grep_search` for `sampling` in `GetTranslatedTextsMapTool.ts`
      **Expected:** `sampling?: string` in interface

- [ ] `getTranslatedTextsMapCore` implements even-spacing using `Math.floor(i * totalCount / limit)` index formula
      **Type:** read-only
      **Verify:** `read_file` of `XliffToolsCore.ts` — the even-spacing logic
      **Expected:** Deterministic selection spanning the full map, offset ignored when sampling="even"

- [ ] When `sampling` is undefined or not `"even"`, behavior is unchanged (first-N)
      **Type:** execution
      **Verify:** Run existing tests — `npm run test` from `extension/`
      **Expected:** All existing tests pass

- [ ] New tests cover: even-spacing produces correct count, even distribution across entries, edge cases (limit >= total, limit=0, limit=1, empty map, offset ignored with sampling)
      **Type:** execution
      **Verify:** `npm run test` from `extension/`
      **Expected:** New tests pass

- [ ] MCP Zod schema also includes `outputFormat` parameter (pre-existing gap fix)
      **Type:** read-only
      **Verify:** `grep_search` for `outputFormat` in `server.ts` near `getTranslatedTextsMapSchema`
      **Expected:** `outputFormat` in Zod schema with enum ["json", "tsv"]

- [ ] MCP Zod schema includes `sampling` parameter with enum `["even"]`
      **Type:** read-only
      **Verify:** `grep_search` for `sampling` in `server.ts`
      **Expected:** Zod enum or string validation for "even"

- [ ] `package.json` inputSchema includes `sampling` parameter description
      **Type:** read-only
      **Verify:** `grep_search` for `sampling` in `package.json`
      **Expected:** Schema property with description and enum

- [ ] `npm run test-compile` passes with zero errors
      **Type:** execution
      **Verify:** `npm run test-compile` from `extension/`
      **Expected:** Exit code 0, no errors

- [ ] `npm run lint` passes with zero warnings
      **Type:** execution
      **Verify:** `npm run lint` from `extension/`
      **Expected:** Exit code 0, no warnings

- [ ] CHANGELOG.md updated with new `sampling` parameter entry
      **Type:** read-only
      **Verify:** `grep_search` for `sampling` in `CHANGELOG.md`
      **Expected:** Entry under newest version

- [ ] MCP_SERVER.md updated with `sampling` parameter documentation
      **Type:** read-only
      **Verify:** `grep_search` for `sampling` in `MCP_SERVER.md`
      **Expected:** Parameter documented with description and values

**Output for subsequent units:**

`getTranslatedTextsMap` supports `sampling="even"` parameter. The agent instruction changes in Unit 2 can reference this parameter.

**Completion Notes:**

- Files modified: 7 (XliffToolsCore.ts, GetTranslatedTextsMapTool.ts, server.ts, package.json, GetTranslatedTextsMapTool.test.ts, CHANGELOG.md, MCP_SERVER.md)
- Issues encountered: None
- Deviations from plan: None

---

### Unit 2: Update Translation Agent Instructions

**Complexity:** Moderate
**Status:** ✅ Completed
**Depends on:** Unit 1

> **Dependency rationale:** Unit 2 references `sampling="even"` parameter added in Unit 1. The agent instructions must match the available tool parameters.

**Description:**
Update the translation agent and workflow instructions to: (1) load translated texts map with `limit=250` and `sampling="even"`, (2) change batch size from 50→100 and max iterations from 8→4, and (3) add thinking efficiency guidance to reduce context growth per iteration.

**Files:**

- `extension/assets/agents/NAB-XLF-Translator.agent.md` — update context loading, self-loop parameters, add thinking efficiency section
- `extension/assets/instructions/translation-workflow.instructions.md` — update batch size and iteration references
- `extension/assets/prompts/translateXlfFiles.prompt.md` — update batch size and iteration references

**Pre-conditions:**

- Unit 1 complete — `sampling="even"` parameter available on `getTranslatedTextsMap`

**Acceptance Criteria:**

- [ ] Context loading step calls `getTranslatedTextsMap` with `outputFormat="tsv"`, `limit=250`, `sampling="even"`
      **Type:** read-only
      **Verify:** `grep_search` for `getTranslatedTextsMap` in `NAB-XLF-Translator.agent.md`
      **Expected:** Tool call includes all three parameters

- [ ] Self-loop uses `limit=100` for `getTextsToTranslate` calls
      **Type:** read-only
      **Verify:** `grep_search` for `limit=100` in `NAB-XLF-Translator.agent.md`
      **Expected:** `getTextsToTranslate(offset=0, limit=100)`

- [ ] Max iterations changed from 8 to 4
      **Type:** read-only
      **Verify:** `grep_search` for `iteration >= 4` in `NAB-XLF-Translator.agent.md`
      **Expected:** `IF iteration >= 4 → EXIT LOOP`

- [ ] Thinking efficiency section added with guidance on concise reasoning
      **Type:** read-only
      **Verify:** `grep_search` for `Reasoning Efficiency` in `NAB-XLF-Translator.agent.md`
      **Expected:** Section with rules for concise translation reasoning

- [ ] `translation-workflow.instructions.md` updated with new batch size (100) and iteration count (4)
      **Type:** read-only
      **Verify:** `grep_search` for `100 texts` in `translation-workflow.instructions.md`
      **Expected:** References to 100 texts per iteration and 4 iterations

- [ ] `translateXlfFiles.prompt.md` updated with new batch size and iteration count
      **Type:** read-only
      **Verify:** `grep_search` for `limit=100` in `translateXlfFiles.prompt.md`
      **Expected:** Updated references to 100 texts per batch and 4 iterations

- [ ] No stale references to `limit=50` or `iterations=8` remain in modified files
      **Type:** read-only
      **Verify:** `grep_search` for `limit=50` and `iteration.*8` in all three files
      **Expected:** Zero matches (except historical/analysis context)

- [ ] `npm run lint` passes (instruction files are checked by Prettier)
      **Type:** execution
      **Verify:** `npm run lint` from `extension/`
      **Expected:** Exit code 0, no warnings

**Output for subsequent units:**

Translation agent now uses optimized context loading and iteration parameters. Thinking efficiency guidance is in place.

**Completion Notes:**

- Files modified: 3 (NAB-XLF-Translator.agent.md, translation-workflow.instructions.md, translateXlfFiles.prompt.md)
- Issues encountered: None
- Deviations from plan: None

---

### Unit 3: Final Review

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
- Lint clean and build succeeds (`npm run lint`, `npm run webpack`)

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

| Unit | Title                                 | Complexity | Status       | Depends On |
| ---- | ------------------------------------- | ---------- | ------------ | ---------- |
| 1    | Add `sampling` parameter              | Moderate   | ✅ Completed | —          |
| 2    | Update translation agent instructions | Moderate   | ✅ Completed | Unit 1     |
| 3    | Final Review                          | Moderate   | ✅ Completed | All prior  |

**Status legend:** ⬚ Not Started · 🔄 In Progress · ✅ Completed · ⏸️ Blocked

## Session Log

| Date       | Unit | Notes                                                                                                                                                              |
| ---------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-05 | 1    | Added `sampling` parameter with even-spacing algorithm. 6 new tests. MCP `outputFormat` gap fixed. All quality gates pass (601 tests, lint clean, webpack OK).     |
| 2026-04-05 | 2    | Updated batch 50→100, iterations 8→4, added `sampling="even"` to context loading, added Reasoning Efficiency section. Lint clean.                                  |
| 2026-04-05 | 3    | Final review: 5 parallel tracks — Track C found missing params in translation-workflow.instructions.md, fixed. All gates pass (601 tests, lint clean, webpack OK). |

## Open Questions

_(All resolved — see Key Decisions table)_

## Exploration Findings

### Context Budget Breakdown (Observed Session)

Based on analysis of a real Icelandic translation session (~9.8MB, 7 iterations before compaction at ~491K chars):

- **Thinking blocks** vary 3.6x between iterations (7K–25K chars, avg ~18K)
- **Per-iteration cost:** ~50K chars (thinking + tool results + save args + overhead)
- **Available iteration budget:** ~368K chars after initial context (~144K)
- 8×50 configuration hits compaction at ~7 iterations

### Current Codebase State

- `getTranslatedTextsMap` supports `limit` and `offset` but no sampling strategy
- Pagination uses sequential counter — always returns first N entries
- Agent instructions hardcode `limit=50` for `getTextsToTranslate` and `max iterations=8`
- Both agent file and workflow instructions file need updating for batch size change

## Notes

- Plan file is a living document — update as work progresses
- If a unit turns out to be too large during execution, split it and update the plan
- Success measurement: compare iteration counts and compaction rates in session logs before vs after these changes
