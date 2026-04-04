# NAB AL Tools — extension/assets Cleanup

> **Status:** ✅ Completed
> **Packages:** 3/3 completed

## Summary

Clean up the nab-al-tools `extension/assets/` directory — fix bugs in cross-references, trim the oversized glossary-management instructions, and polish the agent file. The XLF Translator agent and its supporting files are well-structured overall; this work addresses the remaining quality issues found during review.

**Scope:** All files under `nab-al-tools/extension/assets/` (1 agent, 4 instructions, 3 prompts)

**Out of scope:**

- `xlf-translation-technical-rules.instructions.md` — excellent as-is, no changes needed
- `translation-workflow.instructions.md` — good quality, no changes needed
- `review-translation-workflow.instructions.md` — good quality, no changes needed
- `package.json` registration — correctly configured
- `.github/` files (copilot-instructions.md, agents/, instructions/) — addressed in prior session

## Context & References

- Agent: `nab-al-tools/extension/assets/agents/NAB-XLF-Translator.agent.md` (179 lines)
- Instructions: `nab-al-tools/extension/assets/instructions/glossary-management.instructions.md` (685 lines)
- Instructions: `nab-al-tools/extension/assets/instructions/translation-workflow.instructions.md` (150 lines)
- Instructions: `nab-al-tools/extension/assets/instructions/review-translation-workflow.instructions.md` (128 lines)
- Instructions: `nab-al-tools/extension/assets/instructions/xlf-translation-technical-rules.instructions.md` (74 lines)
- Prompts: `nab-al-tools/extension/assets/prompts/manageGlossary.prompt.md`
- Prompts: `nab-al-tools/extension/assets/prompts/reviewXlfFiles.prompt.md`
- Prompts: `nab-al-tools/extension/assets/prompts/translateXlfFiles.prompt.md`
- Registration: `nab-al-tools/extension/package.json` lines 1479-1510

## Key Decisions

| #   | Decision                                                   | Rationale                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | No `applyTo` needed on instruction files                   | They're agent-loaded via `read_file`, not auto-applied. Registration in `chatInstructions` is correct for discoverability.                                                                                                                                                                       |
| 2   | Remove hardcoded `read_file` from manageGlossary.prompt.md | The agent's Workflow Activation Protocol already loads instruction files. The hardcoded path is both redundant and fragile.                                                                                                                                                                      |
| 3   | Trim glossary-management by removing examples & condensing | At 685 lines it's the largest file. Conversational examples, troubleshooting, and tooling sections add bulk without proportional value.                                                                                                                                                          |
| 4   | Rename "Critical Compliance" heading in agent file         | The 2 uppercase CRITICAL markers (XLF File Handling, Tool Output) are justified and stay. The `## Critical Compliance` heading is the only overemphasis — rename to "Compliance" or "Workflow Rules". Inline mixed-case "Critical" uses (lines 131, 192, 196) are natural emphasis, leave as-is. |

## Work Packages

### Package 1: Bug Fixes & Polish

**Complexity:** Simple
**Status:** ✅ Completed
**Depends on:** None

**Description:**
Fix the two cross-reference bugs and reduce CRITICAL overuse in the agent file. Also confirm `applyTo` decision (Key Decision #1 — no changes needed).

**Files:**

- `extension/assets/instructions/glossary-management.instructions.md` — Fix end-of-file note: `glossaryManagement.prompt.md` → `manageGlossary.prompt.md`
- `extension/assets/prompts/manageGlossary.prompt.md` — Remove the hardcoded `read_file(filePath: ...)` instruction block. Keep the reference to the instruction file and the usage examples.
- `extension/assets/agents/NAB-XLF-Translator.agent.md` — Rename "Critical Compliance" section to "Compliance" or "Workflow Rules" (remove unnecessary emphasis). Keep the two justified CRITICALs (XLF File Handling, Tool Output).

**Pre-conditions:**

- None

**Acceptance Criteria:**

- [x] glossary-management.instructions.md references correct prompt filename `manageGlossary.prompt.md`
- [x] manageGlossary.prompt.md no longer contains hardcoded `read_file` with workspace-relative path
- [x] manageGlossary.prompt.md still references glossary-management.instructions.md via markdown link
- [x] `## Critical Compliance` heading renamed to non-emphasized heading (e.g., "Compliance" or "Workflow Rules")
- [x] The 2 justified uppercase CRITICAL markers (XLF File Handling, Tool Output) remain unchanged
- [x] Inline mixed-case "Critical" uses left as-is
- [x] No functional behavior changes — only label/reference fixes

---

### Package 2: Trim glossary-management.instructions.md

**Complexity:** Moderate
**Status:** ✅ Completed
**Depends on:** Package 1

**Description:**
Reduce glossary-management.instructions.md from ~685 to ~450 lines by removing verbose content and condensing sections. The file has detailed conversational examples, troubleshooting recipes, and tooling references that add bulk without proportional value for LLM consumption.

**Files:**

- `extension/assets/instructions/glossary-management.instructions.md` — Trim the following sections:

**Sections to remove or heavily condense:**

1. **Practical Example** (lines ~217-262, ~45 lines) — Full `Agent:`/`User:` dialogue demonstrating extraction workflow. Remove entirely — the workflow steps above it are sufficient.
2. **Common Issues and Solutions** (lines ~505-556, ~50 lines) — 5 issue/symptom/solution blocks. Condense to 3-5 compact one-liner bullets (duplicate terms, encoding, coverage gaps, tab alignment). Keep the real operational guidance, just remove the verbose symptom/solution format.
3. **Tools and Utilities** (lines ~559-593, ~35 lines) — Editor recommendations, populate-glossary.js reference, "create custom validation scripts" suggestion. Remove editor recommendations and script suggestions. Keep only the getGlossaryTerms tool reference (already documented in agent file).
4. **Examples section** (lines ~595-682, ~90 lines) — Three full `Agent:`/`User:` dialogue examples. Remove entirely — the structured workflow sections provide the same guidance.
5. **Extraction Strategy scoring formula** (lines ~162-175, ~15 lines) — Formal scoring formula with point values. Condense to a priority-ordered list (the agent doesn't need to compute scores).

**Sections to keep intact:**

- Glossary File Structure (format spec, column structure, example structure)
- Glossary Operations workflows (Create, Add Language, Review, Validate) — these are the core instructions
- Integration with Translation Workflow
- Best Practices
- Quality Checks checklists

**Pre-conditions:**

- Package 1 completed (filename fix already applied to end note)

**Acceptance Criteria:**

- [x] File is ≤450 lines
- [x] All 4 operation workflows (Create, Add Language, Review, Validate) are preserved
- [x] Glossary File Structure section is preserved
- [x] Quality Checks checklists are preserved
- [x] Integration with Translation Workflow section is preserved
- [x] Best Practices section is preserved
- [x] No conversational `Agent:`/`User:` dialogue examples remain
- [x] Common Issues condensed to compact bullet list (3-5 one-liner bullets)
- [x] Tools section reduced to essentials only
- [x] End-of-file note still references correct prompt filename (from Package 1 fix)

---

### Package 3: Final Review

**Complexity:** Moderate
**Status:** ✅ Completed
**Depends on:** All prior packages

**Description:**
Cross-cutting review of all work done across prior packages. Dispatch three parallel `NAB-Explore` subagents for independent review tracks, then run Prettier.

**Review tracks (run in parallel as NAB-Explore subagents):**

**Track A — Mechanical checks:**

- Plan completeness: every package status is ✅, every Acceptance Criteria is checked off (`- [x]`)
- Orphan detection: workspace-wide grep for any deleted/renamed filenames returns zero hits (excluding plan files and design docs)
- Cross-reference integrity: modified files reference each other correctly, no broken links or stale paths

**Track B — Standards compliance:**

- Writing standards: content follows directive tone, no unnecessarily verbose sections
- Instruction file structure matches patterns in other instruction files (frontmatter, sections)
- Prompt files are clean and minimal

**Track C — Holistic coherence:**

- Read the final result end-to-end as a whole, not package-by-package
- Identify gaps, redundancies, or inconsistencies introduced by the package boundaries
- Verify the combined output achieves the stated goal from the plan Summary

**After all tracks complete:**

- Run Prettier on all files modified across all packages
- Consolidate findings from all tracks

**Files:**

- No file modifications (review only + formatting)

**Pre-conditions:**

- All prior packages completed

**Acceptance Criteria:**

- [x] Track A: all mechanical checks pass
- [x] Track B: all standards checks pass
- [x] Track C: holistic review finds no gaps or inconsistencies
- [x] Prettier applied to all modified files
- [x] Any issues found are resolved before marking package complete
- [x] Commit message generated covering all packages (the only commit for this plan)

---

## Progress Tracking

| Package | Title                    | Complexity | Status       | Depends On |
| ------- | ------------------------ | ---------- | ------------ | ---------- |
| 1       | Bug Fixes & Polish       | Simple     | ✅ Completed | —          |
| 2       | Trim glossary-management | Moderate   | ✅ Completed | Package 1  |
| 3       | Final Review             | Moderate   | ✅ Completed | All prior  |

**Status legend:** ⬚ Not Started · 🔄 In Progress · ✅ Completed · ⏸️ Blocked

## Session Log

| Date       | Package | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-04 | 1       | Completed. Fixed prompt filename reference in glossary-management.instructions.md, removed hardcoded read_file from manageGlossary.prompt.md, renamed "Critical Compliance" → "Compliance" in agent file. Also refined plan: clarified CRITICAL criterion, adjusted line target to ≤450, changed Common Issues to bullet list approach.                                                                                                                                                                                      |
| 2026-04-04 | 2       | Completed. Trimmed glossary-management.instructions.md from 686 to 438 lines. Removed: Practical Example dialogue, 3 Examples dialogues, verbose Tools/Utilities section. Condensed: scoring formula to priority list, Common Issues to 5 one-liner bullets, candidate identification criteria, description generation sources. All 4 operation workflows, Quality Checks, Best Practices, and Integration sections preserved.                                                                                               |
| 2026-04-04 | 3       | Completed. Track A (mechanical): all checks pass — plan completeness, orphan detection, cross-reference integrity. Track B (standards): modified files pass all checks; agent file has pre-existing narrative prose (out of scope). Track C (holistic): cleanup goals achieved; future improvements noted (XLF state definitions, prompt expansion, glossary initialization consolidation — all out of scope). Prettier applied to all 3 modified files (443 lines final for glossary-management). Commit message generated. |

## Prompt Template

To start work on a package, open a new chat in `framework-maintainer` mode and use:

> Execute **work package {N}** from plan [WIP/plan-nab-al-tools-assets-cleanup.md](WIP/plan-nab-al-tools-assets-cleanup.md).
>
> This is a **plan-based execution** — the plan file contains targets, requirements, and implementation details.
> Skip Steps 1-3 (planning). Read the plan, verify pre-conditions, then create execution-phase todos and run Steps 4-6 and 9-10.
> Skip commit message generation (Steps 7-8) — the Final Review package handles the commit for all work.
> After completing, check off acceptance criteria (`- [x]`) in the plan file, update package status, and add a Session Log entry.
