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
npm run lint          # Prettier formatting check + ESLint static analysis
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

- Compile extension with zero warnings/errors
- Run linters/static analysis with zero warnings/errors
- Run all tests and ensure they pass
- Ensure code adheres to coding guidelines

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

- Update tool/parameter descriptions in both VS Code extension and MCP server code
- Add or update usage examples in documentation
- Update MCP_SERVER.md, README.md, and mcp-resources/README.md as needed

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

Follow TDD for bug fixes:

1. **Create a Test Case**: Write a failing test that reproduces the bug
2. **Verify the Bug**: Run test to confirm it fails, capturing the buggy behavior
3. **Fix the Bug**: Implement the code fix
4. **Verify the Fix**: Run test to confirm it passes

This ensures bugs are documented, fixes are verified, and regressions are prevented.

### Feature Development Approach

Follow Red-Green-Refactor:

1. **Red**: Write a failing test defining desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up while keeping tests green (remove duplication, improve naming, optimize)

Benefits: Clear requirements via tests, focused development, safe refactoring, maintainability.

## Task Comprehension & Execution Mandate

> Detailed mandate is in `.github/agents/nab-al-tools-agent.agent.md`. The following is a summary.
> When operating as the nab-al-tools-agent, follow the full mandate in the agent file.

Key principles: Extract all requirements as checklist items, maintain a living checklist, prefer acting over speculative advice, verify facts before stating, run quality gates before declaring completion.
