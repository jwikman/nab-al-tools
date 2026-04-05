# Revert returnAsUri & ToolOutputContentProvider — Work Plan

> **Status:** Completed
> **Created:** 2026-04-05
> **Last Updated:** 2026-04-05
> **Build command:** `npm run webpack` (from `extension/`)
> **Test command:** `npm run test` (from `extension/`, use `xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npm run test` for headless)
> **Lint command:** `npm run lint` (from `extension/`)
> **Units:** 5/5 completed

## Summary

Remove the `returnAsUri` parameter, `ToolOutputContentProvider` (custom virtual document content provider), and associated infrastructure because the custom `nab-al-tools:` URI scheme does not work as expected. Instead of the preparation subagent pre-loading glossary and translated texts map into virtual documents, each translator subagent will call `getGlossaryTerms` and `getTranslatedTextsMap` directly at the start of its session.

**Scope:**

- Delete `ToolOutputContentProvider.ts` and its test file
- Remove `returnAsUri` parameter from `GetGlossaryTermsTool` and `GetTranslatedTextsMapTool`
- Remove content provider registration from `extension.ts`
- Remove `returnAsUri` from `package.json` schemas and descriptions
- Remove all `returnAsUri` test cases
- Update translation workflow: prep subagent no longer fetches glossary/text map; each translator subagent fetches its own
- Update CHANGELOG entries for Units 6+7 to reflect the new approach

**Out of scope:**

- `outputFormat` parameter (Unit 5) — kept as-is
- Compact JSON for MCP (Unit 1) — kept as-is
- Glossary TSV format (Unit 2) — kept as-is
- sourceLanguage envelope (Unit 4) — kept as-is
- Instruction deduplication (Unit 3) — kept as-is
- MCP server changes — unaffected (MCP was excluded from returnAsUri)

## Context & References

- Previous plan: `.aidocs/plans/plan-tool-output-and-translation-architecture.md`
- Content provider: `extension/src/ChatTools/shared/ToolOutputContentProvider.ts`
- Affected tools: `extension/src/ChatTools/GetGlossaryTermsTool.ts`, `extension/src/ChatTools/GetTranslatedTextsMapTool.ts`
- Extension entry: `extension/src/extension.ts`
- Agent/instructions: `extension/assets/agents/NAB-XLF-Translator.agent.md`, `extension/assets/prompts/translateXlfFiles.prompt.md`, `extension/assets/instructions/translation-workflow.instructions.md`
- Package manifest: `extension/package.json`
- Documentation: `extension/CHANGELOG.md`

## Key Decisions

| #   | Decision                                                      | Rationale                                                                                                                             |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Remove returnAsUri entirely (not fix)                         | Custom `nab-al-tools:` URI scheme does not work; no viable fix identified                                                             |
| 2   | Prep subagent still builds + discovers XLF files              | Keeps orchestrator thin; build + discovery isolated in prep subagent                                                                  |
| 3   | Each translator subagent fetches glossary + text map itself   | Removes URI indirection; subagent has direct tool access; simpler architecture                                                        |
| 4   | Translator fetches text map once per session (not per loop)   | Text map provides translation style context; fetched once at session start                                                            |
| 5   | Keep outputFormat parameter                                   | Independent of returnAsUri; provides format flexibility for consumers                                                                 |
| 6   | Update existing CHANGELOG entries rather than adding new ones | These features haven't been released yet; cleaner to update in-place                                                                  |
| 7   | No version bump needed                                        | `returnAsUri` was added on `dev/agent-rework` and never released; removing it is a pre-release change, not a breaking change to users |

## Assumptions

| #   | Assumption                                                                                                | Status   |
| --- | --------------------------------------------------------------------------------------------------------- | -------- |
| 1   | `ToolOutputContentProvider` is only used by `GetGlossaryTermsTool` and `GetTranslatedTextsMapTool`        | Verified |
| 2   | `TOOL_OUTPUT_SCHEME` is only referenced in `ToolOutputContentProvider.ts`, `extension.ts`, and test files | Verified |
| 3   | MCP server has no `returnAsUri` references                                                                | Verified |
| 4   | `outputFormat` parameter is independent of `returnAsUri` and does not need changes                        | Verified |
| 5   | Translator subagents have direct access to `getGlossaryTerms` and `getTranslatedTextsMap` tools           | Verified |
| 6   | Prep subagent return format can drop `glossaryFileUri` and `textsMapFileUri` fields                       | Verified |

## Work Units

---

### Unit 1: Remove ToolOutputContentProvider + returnAsUri from Source Code

**Complexity:** Complex
**Status:** ✅ Completed
**Depends on:** None

**Description:**
Delete the `ToolOutputContentProvider` file and remove all `returnAsUri` parameter handling from the two tools that use it (`GetGlossaryTermsTool`, `GetTranslatedTextsMapTool`). Remove the content provider registration from `extension.ts`. Remove `returnAsUri` from `package.json` tool schemas and `modelDescription` fields.

**Files:**

- `extension/src/ChatTools/shared/ToolOutputContentProvider.ts` — **DELETE** entire file
- `extension/src/extension.ts` — remove import of `ToolOutputContentProvider` and `TOOL_OUTPUT_SCHEME`, remove provider instantiation and registration, remove `outputProvider` parameter from tool constructors
- `extension/src/ChatTools/GetGlossaryTermsTool.ts` — remove `returnAsUri` from `IGetGlossaryTermsParameters` interface, remove `outputProvider` constructor parameter and field, remove returnAsUri handling in `invoke()` method
- `extension/src/ChatTools/GetTranslatedTextsMapTool.ts` — remove `returnAsUri` from `ITranslatedTextsMapParameters` interface, remove `outputProvider` constructor parameter and field, remove returnAsUri handling in `invoke()` method
- `extension/package.json` — remove `returnAsUri` property from `getGlossaryTerms` and `getTranslatedTextsMap` input schemas; remove returnAsUri mention from `modelDescription` fields

**Pre-conditions:**

- None

**Acceptance Criteria:**

- [ ] `ToolOutputContentProvider.ts` file no longer exists
      **Type:** read-only
      **Verify:** `file_search` for `**/ToolOutputContentProvider.ts` in `extension/src/`
      **Expected:** Zero matches
- [ ] No references to `ToolOutputContentProvider` remain in source code (excluding test files)
      **Type:** read-only
      **Verify:** `grep_search` for `ToolOutputContentProvider` in `extension/src/` excluding test files
      **Expected:** Zero matches
- [ ] No references to `TOOL_OUTPUT_SCHEME` remain in source code (excluding test files)
      **Type:** read-only
      **Verify:** `grep_search` for `TOOL_OUTPUT_SCHEME` in `extension/src/` excluding test files
      **Expected:** Zero matches
- [ ] No references to `returnAsUri` remain in source code (excluding test files)
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsUri` in `extension/src/` excluding test files
      **Expected:** Zero matches
- [ ] No `returnAsUri` property in `package.json`
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsUri` in `extension/package.json`
      **Expected:** Zero matches
- [ ] `GetGlossaryTermsTool` constructor no longer accepts `outputProvider` parameter
      **Type:** read-only
      **Verify:** Read `GetGlossaryTermsTool.ts` constructor
      **Expected:** No `outputProvider` parameter
- [ ] `GetTranslatedTextsMapTool` constructor no longer accepts `outputProvider` parameter
      **Type:** read-only
      **Verify:** Read `GetTranslatedTextsMapTool.ts` constructor
      **Expected:** No `outputProvider` parameter
- [ ] `npm run webpack` passes with zero errors
      **Type:** execution
      **Verify:** Run command from `extension/`
      **Expected:** Exit code 0

> **Note:** `npm run test-compile` and `npm run test` will fail after this unit because test files still import the deleted `ToolOutputContentProvider`. This is expected and resolved in Unit 2.

**Output for subsequent units:**

- `ToolOutputContentProvider.ts` deleted
- `returnAsUri` parameter removed from all source code
- Content provider no longer registered in extension.ts
- package.json schemas updated
- Test files will have compile errors (resolved in Unit 2)

**Completion Notes:**

- Files modified: 5 (ToolOutputContentProvider.ts deleted, extension.ts, GetGlossaryTermsTool.ts, GetTranslatedTextsMapTool.ts, package.json)
- Issues encountered: webpack includes test files so build fails until Unit 2 completes — expected per plan note
- Deviations from plan: None

---

### Unit 2: Remove returnAsUri Tests

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** Unit 1

> **Dependency rationale:** Test files import `ToolOutputContentProvider` and `TOOL_OUTPUT_SCHEME`, which are deleted in Unit 1. Tests will not compile until Unit 1 is complete.

**Description:**
Delete the `ToolOutputContentProvider.test.ts` file entirely. Remove all `returnAsUri`-related test cases from `GetGlossaryTermsTool.test.ts` and `GetTranslatedTextsMapTool.test.ts`, including imports of `ToolOutputContentProvider` and `TOOL_OUTPUT_SCHEME`.

**Files:**

- `extension/src/test/ChatTools/ToolOutputContentProvider.test.ts` — **DELETE** entire file
- `extension/src/test/ChatTools/GetGlossaryTermsTool.test.ts` — remove `ToolOutputContentProvider` import and `TOOL_OUTPUT_SCHEME` import, remove 4 returnAsUri test cases (~lines 332-452), remove `outputProvider` from test instances
- `extension/src/test/ChatTools/GetTranslatedTextsMapTool.test.ts` — remove `ToolOutputContentProvider` import, remove 3 returnAsUri test cases (~lines 581-728), remove `outputProvider` from test instances

**Pre-conditions:**

- Unit 1 complete: `ToolOutputContentProvider.ts` deleted, `returnAsUri` removed from tool interfaces

**Acceptance Criteria:**

- [ ] `ToolOutputContentProvider.test.ts` file no longer exists
      **Type:** read-only
      **Verify:** `file_search` for `**/ToolOutputContentProvider.test.ts`
      **Expected:** Zero matches
- [ ] No references to `ToolOutputContentProvider` remain in test files
      **Type:** read-only
      **Verify:** `grep_search` for `ToolOutputContentProvider` in `extension/src/test/`
      **Expected:** Zero matches
- [ ] No references to `returnAsUri` remain in test files
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsUri` in `extension/src/test/`
      **Expected:** Zero matches
- [ ] No references to `TOOL_OUTPUT_SCHEME` remain in test files
      **Type:** read-only
      **Verify:** `grep_search` for `TOOL_OUTPUT_SCHEME` in `extension/src/test/`
      **Expected:** Zero matches
- [ ] `npm run test-compile` passes with zero errors
      **Type:** execution
      **Verify:** Run command from `extension/`
      **Expected:** Exit code 0
- [ ] `npm run lint` passes with zero warnings
      **Type:** execution
      **Verify:** Run command from `extension/`
      **Expected:** Exit code 0
- [ ] All tests pass
      **Type:** execution
      **Verify:** `npm run test` from `extension/`
      **Expected:** Exit code 0

**Output for subsequent units:**

- All returnAsUri-related test code removed
- Full test suite passes
- Build and lint clean

**Completion Notes:**

- Files modified: 3 (ToolOutputContentProvider.test.ts deleted, GetGlossaryTermsTool.test.ts, GetTranslatedTextsMapTool.test.ts)
- Issues encountered: Prettier formatting fix needed in GetGlossaryTermsTool.ts
- Deviations from plan: None. 17 test cases removed, 596 remaining tests pass.

---

### Unit 3: Update Translation Workflow Documentation

**Complexity:** Complex
**Status:** ⬚ Not Started
**Depends on:** None

**Description:**
Update the three translation workflow files to reflect the new architecture: each translator subagent fetches glossary and translated texts map directly (once per session) instead of receiving pre-loaded URIs from a preparation subagent. The prep subagent still builds the app and discovers XLF files but no longer fetches glossary or text map.

**Key architectural changes:**

1. **Prep subagent** returns: build result + per-language XLF paths and untranslated counts (no `glossaryFileUri` or `textsMapFileUri`)
2. **Translator subagent** (NAB-XLF-Translator): at session start, calls `getGlossaryTerms(targetLanguage)` and `getTranslatedTextsMap(filePath)` directly, then proceeds with self-looping translation
3. **No URI mode** in NAB-XLF-Translator: remove "When File URIs Are Provided" section; there is only one mode — direct tool calls

**Files:**

- `extension/assets/prompts/translateXlfFiles.prompt.md` — update prep subagent instructions to remove `getGlossaryTerms` and `getTranslatedTextsMap` calls (and `returnAsUri: true`); remove `glossaryFileUri`/`textsMapFileUri` from return format; update translator subagent prompt to instruct direct tool calls instead of URI reading
- `extension/assets/agents/NAB-XLF-Translator.agent.md` — remove "When File URIs Are Provided" / URI-based context loading mode; ensure the single context loading path calls tools directly; remove all `nab-al-tools:` URI references
- `extension/assets/instructions/translation-workflow.instructions.md` — update architecture description to remove URI indirection; update prep subagent section to remove glossary/text-map fetching; update translator subagent section to show direct tool calls at session start

**Pre-conditions:**

- None (documentation changes are independent of code changes)

**Acceptance Criteria:**

- [ ] No references to `returnAsUri` remain in any agent/instruction/prompt file
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsUri` in `extension/assets/`
      **Expected:** Zero matches
- [ ] No references to `nab-al-tools:` URI scheme remain in any agent/instruction/prompt file
      **Type:** read-only
      **Verify:** `grep_search` for `nab-al-tools:` in `extension/assets/`
      **Expected:** Zero matches
- [ ] No references to `glossaryFileUri` or `textsMapFileUri` remain
      **Type:** read-only
      **Verify:** `grep_search` for `glossaryFileUri|textsMapFileUri` in `extension/assets/`
      **Expected:** Zero matches
- [ ] Prep subagent instructions no longer call `getGlossaryTerms` or `getTranslatedTextsMap`
      **Type:** read-only
      **Verify:** Read prep subagent section in `translateXlfFiles.prompt.md`
      **Expected:** No `getGlossaryTerms` or `getTranslatedTextsMap` calls in prep subagent steps
- [ ] Translator subagent instructions include direct calls to `getGlossaryTerms` and `getTranslatedTextsMap` at session start
      **Type:** read-only
      **Verify:** Read context loading section in `NAB-XLF-Translator.agent.md`
      **Expected:** Single mode with direct tool calls (no URI mode)
- [ ] Translator workflow shows text map fetched once per session
      **Type:** read-only
      **Verify:** Read `translation-workflow.instructions.md` translator section
      **Expected:** `getTranslatedTextsMap` called once at start, not per-loop
- [ ] Prep subagent return format no longer includes `glossaryFileUri` or `textsMapFileUri`
      **Type:** read-only
      **Verify:** Read prep subagent return JSON schema in `translateXlfFiles.prompt.md`
      **Expected:** JSON schema contains `code`, `xlfPath`, `untranslatedCount` per language — no URI fields

**Output for subsequent units:**

- Translation workflow documentation reflects new architecture
- No virtual document references remain in instruction files
- Prep subagent role simplified to: build + discover + count untranslated

**Completion Notes:**

- Files modified: 3 (translateXlfFiles.prompt.md, NAB-XLF-Translator.agent.md, translation-workflow.instructions.md)
- Issues encountered: None
- Deviations from plan: None

---

### Unit 4: Update CHANGELOG & Documentation

**Complexity:** Simple
**Status:** ⬚ Not Started
**Depends on:** Units 1, 2, 3

> **Dependency rationale:** CHANGELOG entries must reflect the final state after all code and documentation changes are complete.

**Description:**
Update the existing CHANGELOG.md entries for Units 6 (returnAsUri) and 7 (subagent architecture) to reflect the new approach. Remove the `returnAsUri` entry entirely. Update the translation workflow entry to describe the new architecture where each translator subagent fetches glossary and text map directly. Check README.md and MCP_SERVER.md for any `returnAsUri` references and remove them.

**Files:**

- `extension/CHANGELOG.md` — update/remove entries for returnAsUri and subagent architecture
- `extension/README.md` — remove any `returnAsUri` references (if present)

**Pre-conditions:**

- Units 1-3 complete

**Acceptance Criteria:**

- [ ] No `returnAsUri` mentioned in CHANGELOG.md
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsUri` in `extension/CHANGELOG.md`
      **Expected:** Zero matches
- [ ] Translation workflow CHANGELOG entry describes subagents fetching glossary/text map directly
      **Type:** read-only
      **Verify:** Read the translation workflow entry in CHANGELOG.md
      **Expected:** Describes translator subagent direct tool calls, not URI-based indirection
- [ ] No `returnAsUri` mentioned in README.md
      **Type:** read-only
      **Verify:** `grep_search` for `returnAsUri` in `extension/README.md`
      **Expected:** Zero matches
- [ ] No `nab-al-tools:` URI scheme mentioned in documentation files
      **Type:** read-only
      **Verify:** `grep_search` for `nab-al-tools:` in `extension/CHANGELOG.md`, `extension/README.md`, `extension/MCP_SERVER.md`
      **Expected:** Zero matches

**Output for subsequent units:**

- All documentation reflects the new architecture
- No stale references to removed features

**Completion Notes:**

- Files modified: 3 (CHANGELOG.md, README.md, MCP_SERVER.md)
- Issues encountered: None
- Deviations from plan: None

---

### Unit 5: Final Review

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** All prior units

**Description:**
Cross-cutting review of all work done across prior units. Run five parallel review tracks, then apply formatting.

**Review tracks (run in parallel as subagents):**

**Track A — Mechanical checks:**

- Plan completeness: every unit status is ✅, every AC is checked off (`- [x]`)
- Orphan detection: workspace-wide grep for `returnAsUri`, `ToolOutputContentProvider`, `TOOL_OUTPUT_SCHEME`, `nab-al-tools:`, `glossaryFileUri`, `textsMapFileUri` returns zero hits (excluding plan files and design docs)
- Cross-reference integrity: modified files reference each other correctly, no broken links or stale paths

**Track B — Code quality:**

- Codebase conventions followed (naming, structure, patterns)
- No debug artifacts, TODO comments, or temporary code left behind
- Lint clean and build succeeds

**Track C — Holistic coherence:**

- Read the final result end-to-end as a whole, not unit-by-unit
- Identify gaps, redundancies, or inconsistencies introduced by the unit boundaries
- Verify the combined output achieves the stated goal

**Track D — Dependency & conflict verification:**

- Verify all units that modified the same file did so in dependency order
- Confirm no orphaned dependencies
- Check critical path was efficient

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

| Unit | Title                                                      | Complexity | Status        | Depends On |
| ---- | ---------------------------------------------------------- | ---------- | ------------- | ---------- |
| 1    | Remove ToolOutputContentProvider + returnAsUri from source | Complex    | ✅ Completed   | —          |
| 2    | Remove returnAsUri tests                                   | Moderate   | ✅ Completed   | Unit 1     |
| 3    | Update translation workflow documentation                  | Complex    | ✅ Completed   | —          |
| 4    | Update CHANGELOG & documentation                           | Simple     | ✅ Completed   | Units 1-3  |
| 5    | Final Review                                               | Moderate   | ✅ Completed   | All prior  |

**Status legend:** ⬚ Not Started · 🔄 In Progress · ✅ Completed · ⏸️ Blocked

## Session Log

| Date | Unit | Notes |
| ---- | ---- | ----- |
| 2026-04-05 | 1-5 | All units completed in single session. Build/lint/tests pass. Typo fix ("Refeactor"→"Refactor") applied during final review. |

## Open Questions

_None — all questions resolved during planning._

## Exploration Findings

- `ToolOutputContentProvider` is used by exactly 2 tools: `GetGlossaryTermsTool` and `GetTranslatedTextsMapTool`
- `TOOL_OUTPUT_SCHEME` is defined in `ToolOutputContentProvider.ts` and imported in `extension.ts` and test files
- `returnAsUri` appears in `package.json` at 2 locations (tool input schemas) and in `modelDescription` fields
- Test files contain 7 returnAsUri test cases total (4 in glossary tests, 3 in texts-map tests) plus 6 provider tests
- Translation workflow currently has two modes in `NAB-XLF-Translator.agent.md`: URI-based (prep subagent populates) and direct (standalone invocation). Post-revert, only one mode remains: direct tool calls.
- MCP server has no `returnAsUri` references — unaffected by this plan

## Notes

- Plan file is a living document — update as work progresses
- If a unit turns out to be too large during execution, split it and update the plan
- Units 1+2 (code) and Unit 3 (docs) can run in parallel since they affect different files
- This plan only reverts Units 6-7 changes from the original plan; Units 1-5 and 8-10 remain intact
