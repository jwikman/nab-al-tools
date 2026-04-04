# NAB AL Tools — extension/assets Cleanup

> **Status:** Not Started
> **Packages:** 0/3 completed

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

| #   | Decision                                                   | Rationale                                                                                                                                                                                           |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No `applyTo` needed on instruction files                   | They're agent-loaded via `read_file`, not auto-applied. Registration in `chatInstructions` is correct for discoverability.                                                                          |
| 2   | Remove hardcoded `read_file` from manageGlossary.prompt.md | The agent's Workflow Activation Protocol already loads instruction files. The hardcoded path is both redundant and fragile.                                                                         |
| 3   | Trim glossary-management by removing examples & condensing | At 685 lines it's the largest file. Conversational examples, troubleshooting, and tooling sections add bulk without proportional value.                                                             |
| 4   | Reduce CRITICAL markers in agent from 3 to 2               | XLF File Handling CRITICAL is justified (data corruption risk). Tool Output CRITICAL is justified (common parsing error). "Critical Compliance" section can be renamed to avoid emphasis inflation. |

## Work Packages

### Package 1: Bug Fixes & Polish

**Complexity:** Simple
**Status:** ⬚ Not Started
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

- [ ] glossary-management.instructions.md references correct prompt filename `manageGlossary.prompt.md`
- [ ] manageGlossary.prompt.md no longer contains hardcoded `read_file` with workspace-relative path
- [ ] manageGlossary.prompt.md still references glossary-management.instructions.md via markdown link
- [ ] NAB-XLF-Translator.agent.md has ≤2 CRITICAL markers
- [ ] "Critical Compliance" section renamed to non-emphasized heading
- [ ] No functional behavior changes — only label/reference fixes

---

### Package 2: Trim glossary-management.instructions.md

**Complexity:** Moderate
**Status:** ⬚ Not Started
**Depends on:** Package 1

**Description:**
Reduce glossary-management.instructions.md from ~685 to ~400 lines by removing verbose content and condensing sections. The file has detailed conversational examples, troubleshooting recipes, and tooling references that add bulk without proportional value for LLM consumption.

**Files:**

- `extension/assets/instructions/glossary-management.instructions.md` — Trim the following sections:

**Sections to remove or heavily condense:**

1. **Practical Example** (lines ~217-262, ~45 lines) — Full `Agent:`/`User:` dialogue demonstrating extraction workflow. Remove entirely — the workflow steps above it are sufficient.
2. **Common Issues and Solutions** (lines ~505-556, ~50 lines) — 5 issue/symptom/solution blocks. Condense to a compact table (issue | solution, one row each).
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

- [ ] File is ≤420 lines
- [ ] All 4 operation workflows (Create, Add Language, Review, Validate) are preserved
- [ ] Glossary File Structure section is preserved
- [ ] Quality Checks checklists are preserved
- [ ] Integration with Translation Workflow section is preserved
- [ ] Best Practices section is preserved
- [ ] No conversational `Agent:`/`User:` dialogue examples remain
- [ ] Common Issues condensed to compact format
- [ ] Tools section reduced to essentials only
- [ ] End-of-file note still references correct prompt filename (from Package 1 fix)

---

### Package 3: Final Review

**Complexity:** Moderate
**Status:** ⬚ Not Started
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

- [ ] Track A: all mechanical checks pass
- [ ] Track B: all standards checks pass
- [ ] Track C: holistic review finds no gaps or inconsistencies
- [ ] Prettier applied to all modified files
- [ ] Any issues found are resolved before marking package complete
- [ ] Commit message generated covering all packages (the only commit for this plan)

---

## Progress Tracking

| Package | Title                    | Complexity | Status        | Depends On |
| ------- | ------------------------ | ---------- | ------------- | ---------- |
| 1       | Bug Fixes & Polish       | Simple     | ⬚ Not Started | —          |
| 2       | Trim glossary-management | Moderate   | ⬚ Not Started | Package 1  |
| 3       | Final Review             | Moderate   | ⬚ Not Started | All prior  |

**Status legend:** ⬚ Not Started · 🔄 In Progress · ✅ Completed · ⏸️ Blocked

## Session Log

| Date | Package | Notes |
| ---- | ------- | ----- |

## Prompt Template

To start work on a package, open a new chat in `framework-maintainer` mode and use:

> Execute **work package {N}** from plan [WIP/plan-nab-al-tools-assets-cleanup.md](WIP/plan-nab-al-tools-assets-cleanup.md).
>
> This is a **plan-based execution** — the plan file contains targets, requirements, and implementation details.
> Skip Steps 1-3 (planning). Read the plan, verify pre-conditions, then create execution-phase todos and run Steps 4-6 and 9-10.
> Skip commit message generation (Steps 7-8) — the Final Review package handles the commit for all work.
> After completing, check off acceptance criteria (`- [x]`) in the plan file, update package status, and add a Session Log entry.
