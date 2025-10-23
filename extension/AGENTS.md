# Coding Agent instructions

## Project Structure

The VS Code extension source code is located in the **`/extension`** folder. All compilation and build commands should be run from within this directory.

## Compilation Instructions

This VS Code extension is built using TypeScript and Webpack. Follow these steps to compile and build the extension:

### Build Command

Run `npm run webpack` to build the extension in development mode.

### Testing and Quality Checks

Before committing, run these quality checks:

```bash
npm run test-compile  # TypeScript compilation check
npm run lint          # ESLint static analysis
npm run webpack       # Webpack build
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npm run test          # Run all unit tests, headless
```

### Output Directories

- `dist/` - Production webpack output (created by webpack)
- `out/` - TypeScript compiler output (created by test-compile)

### Entry Points

The webpack configuration builds multiple entry points:

- `extension.ts` → `nab-al-tools.js` (main extension)
- `cli/CreateDocumentation.ts` → `cli/CreateDocumentation.js` (CLI tool)
- `cli/RefreshXLF.ts` → `cli/RefreshXLF.js` (CLI tool)
- `mcp/server.ts` → `mcp/server.js` (MCP server)

## Coding Guidelines

All coding guidelines are found at `/.github/instructions/coding-guidelines.instructions.md`. Please refer to that file for all rules, conventions, and best practices.

## Before Committing Code

- When you have completed your code changes, you must compile extension and ensure there are no warnings or errors.
- Run any linters or static analysis tools and ensure there are no warnings or errors.
- Run all tests and ensure they pass.
- Solve any compilation issues, both warnings and errors, before committing your changes.
- Ensure that all code adheres to the coding guidelines outlined above before committing.

## Task Comprehension & Execution Mandate

The coding agent MUST always perform full task comprehension and end-to-end execution. The following rules are mandatory and override any looser defaults:

### 1. Requirement Extraction (First Response to a Task)

- Read the entire user request (and any referenced prior context) before acting.
- Extract EVERY explicit requirement as individual checklist items (no grouping that hides detail).
- Infer reasonable implicit requirements needed to deliver a working, verifiable solution (e.g., needed helper procedures, minimal tests, docs) and label them as "Implicit" in the checklist.
- If critical information is missing and cannot be safely inferred with one short assumption, ask a single focused clarification question WHILE stating a proposed assumption so work can proceed immediately once answered.

### 2. Checklist Management

- Maintain a living checklist using the provided todo list tooling.
- Only one item may be In-Progress at a time; mark it Completed immediately when done.
- Never drop or rewrite a requirement in a way that obscures its original intent; if scope changes, append a note rather than deleting.

### 3. Execution Discipline

- Prefer acting (reading files, applying patches, compiling) over speculative advice.
- Batch read-only context gathering (3–5 related reads/searches) before edits; then act.
- Avoid redundant restatement of unchanged plan sections—report only deltas in subsequent messages.
- Do not invent paths, object names, or APIs—verify with searches or file reads first if uncertain.

### 4. Coverage Mapping

- In the final substantive response for a task (or after a significant milestone), output a compact "Requirements Coverage" section mapping each checklist item to one of: Done | Deferred (with reason) | Blocked (with clarification requested).
- No task is complete while any non-Deferred, non-Blocked item remains.

### 5. Clarification Policy

- Ask only when genuinely blocked OR when multiple materially different implementations are equally plausible and choice affects downstream work.
- When asking, propose a preferred assumption so progress can continue if the user is silent.

### 6. Quality Gates Before Declaring Completion

- Run compile/build steps for affected projects and ensure zero errors/warnings when code was modified (unless user explicitly allows warnings—otherwise treat warnings as issues to fix or justify).
- Perform minimal smoke validation for new/changed objects where feasible (e.g., ensure procedures compile, events wired, no unused labels created).
- Provide a brief PASS/FAIL summary: Build, Lint/Analyzers, Tests (if any added/modified), plus any notable performance considerations or assumptions.

### 7. Performance & Safety

- Highlight any potential long-running loops or performance risks introduced.

### 8. Proactive Adjacent Improvements

- After satisfying all explicit requirements, add only low-risk, clearly beneficial improvements (e.g., tiny helper extraction, missing docs) and list them separately as "Adjacency Improvements" so they are distinguishable from core scope.

### 9. Non-Compliance Handling

- If prior steps (e.g., checklist creation) were skipped due to earlier context ambiguity, retroactively create and fill them before proceeding further.
- Never declare a task done while violations of the above remain unaddressed.

Failure to follow any of these steps should trigger immediate self-correction in the next message.
