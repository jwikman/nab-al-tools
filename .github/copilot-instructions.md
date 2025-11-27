# Copilot Instructions

## Project Structure

The VS Code extension source code is located in the **`extension`** folder. All compilation and build commands should be run from within this directory.

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

## Updating CHANGELOG

When fixing bugs or implementing features, the `extension/CHANGELOG.md` file must be updated. Add entries under the newest version section only.

### Format Guidelines

**Category Sections** (use the appropriate one):
- `- Added:` or `- New Features:` - for new functionality, settings, or commands
- `- Changed:` or `- Changes:` - for modifications to existing behavior
- `- Fixes:` or `- Fixed:` - for bug fixes

**Entry Format**:
- Each entry is a bullet point indented under the category
- Use backticks for settings: `` `NAB.SettingName` ``
- Use backticks for commands: `` `NAB: Command Name` ``
- Reference issues: `[issue XXX](https://github.com/jwikman/nab-al-tools/issues/XXX)`
- Credit contributors: `Thanks to [@username](https://github.com/username) for reporting/suggesting this in [issue XXX]`
- Use sub-bullets (further indented) for additional details

**Style Guidelines**:
- Use **bold** for breaking changes or important sections
- Describe what changed, why, and what it enables
- Include both problem and solution context
- Common phrases:
  - "Fixed an issue where..."
  - "Fixes [issue XXX]"
  - "Thanks to [@user] for reporting this in [issue XXX]"

**Example**:
```markdown
- Fixes:
  - Fixed an issue where labels with `Locked=true` were not being removed from `*.g.xlf` files when running `NAB: Update g.xlf`. Thanks to [@username](https://github.com/username) for reporting this in [issue 527](https://github.com/jwikman/nab-al-tools/issues/527).
```

## Updating Documentation

When adding or modifying features, especially those exposed through Language Model Tools or MCP Server, all relevant documentation must be updated:

### Documentation Files to Update

1. **CHANGELOG.md** - Always update for any feature changes
2. **README.md** - Update if the feature affects user-facing functionality or tools
3. **MCP_SERVER.md** - Update if the feature affects MCP server tools or endpoints
4. **mcp-resources/README.md** - Update if the feature affects MCP usage examples or workflows

### Language Model Tools and MCP Server Features

When modifying Language Model Tools or MCP Server tools:

- Update tool descriptions in both the VS Code extension code and MCP server code
- Update parameter descriptions in schema definitions
- Add or update usage examples in documentation
- Document new parameters with clear descriptions and examples
- Update the MCP_SERVER.md with detailed parameter documentation
- Update README.md with high-level feature descriptions
- Update mcp-resources/README.md with practical usage examples

### Example Checklist for Tool Changes

When adding a parameter to a tool like `getGlossaryTerms`:
- [ ] Update `GlossaryCore.ts` JSDoc comments
- [ ] Update MCP server schema in `mcp/server.ts`
- [ ] Update VS Code tool interface in `GetGlossaryTermsTool.ts`
- [ ] Update `CHANGELOG.md` with feature description
- [ ] Update `MCP_SERVER.md` with parameter documentation and examples
- [ ] Update `README.md` with feature mention
- [ ] Update `mcp-resources/README.md` with usage examples
- [ ] Add tests for the new functionality

## Test-Driven Development (TDD)

This project follows Test-Driven Development practices for both bug fixes and new feature development.

### Bug Fixing Approach

When working on an assigned issue that is a bug, follow this test-driven development approach:

1. **Create a Test Case**: Write a test that reproduces the bug. The test should fail initially, demonstrating the issue.
2. **Verify the Bug**: Run the test to confirm it fails and that it accurately captures the buggy behavior.
3. **Fix the Bug**: Implement the code changes needed to resolve the issue.
4. **Verify the Fix**: Run the test again to ensure it now passes, confirming the bug is resolved.

This approach ensures that:
- The bug is properly understood and documented through the test case
- The fix actually resolves the issue
- Future regressions are prevented by the new test coverage

### Feature Development Approach

When implementing new features or enhancements, follow the Red-Green-Refactor cycle:

1. **Red - Write a Failing Test**: Before writing any implementation code, write a test that defines the desired behavior. The test should fail because the feature doesn't exist yet.
2. **Green - Make it Pass**: Write the minimal code necessary to make the test pass. Focus on functionality, not perfection.
3. **Refactor - Improve the Code**: Clean up and optimize the implementation while ensuring all tests continue to pass. This may include:
   - Removing duplication
   - Improving naming and readability
   - Optimizing performance
   - Ensuring adherence to coding guidelines

Benefits of this approach:
- **Clear requirements**: Tests document what the feature should do
- **Focused development**: Write only the code needed to satisfy the tests
- **Confidence in changes**: Refactoring is safe with comprehensive test coverage
- **Maintainability**: Well-tested code is easier to modify and extend

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
