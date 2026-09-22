# Agent Improvement Log

**Review Period:** Monthly or as needed

## Pending Improvements

_(Improvements logged by agent during work, awaiting human review)_

### [2026-09-21] Verification - Stated code-prefix rule as fact without checking docs

- **Mistake:** During design discussion for issue #650 (pragma suppression), stated that `AL####` diagnostics are compiler errors that can't be pragma-suppressed, implying code prefix determines suppressibility.
- **Root Cause:** Inferred a rule from the issue text's own wording ("genuine compiler errors (AL####) can't be suppressed by pragma") without independently verifying against AL language documentation before restating it as a design fact.
- **Current Instruction:** Generic instructions say "Always verify facts using available tools before stating them as truth" but this was skipped for a technical claim copied from user-provided issue text.
- **Suggested Improvement:** When restating a technical/behavioral claim sourced from a GitHub issue or user text as a design decision, verify it against authoritative docs (e.g. MS Learn) if it's easy to check, especially when the claim will drive implementation logic (here: the actual rule is severity-based — `Severity == Error` is unsuppressible, not code-prefix-based; e.g. `AL0468` is a suppressible warning).
- **Priority:** Medium

---

## Reviewed & Implemented

_(Improvements accepted and applied to agent instructions)_

---

## Reviewed & Rejected

_(Improvements reviewed but not applicable or needed)_
