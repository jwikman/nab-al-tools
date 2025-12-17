---
applyTo: "**/*.{ts,js,mts,cts,tsx,jsx}"
---

# Coding Guidelines for NAB AL Tools

This document outlines the coding standards, conventions, and best practices for the NAB AL Tools VS Code extension project.

## TypeScript Configuration

### Language Level & Compilation

- **Target**: ES2020
- **Module System**: CommonJS
- **Strict Mode**: Enabled with all strict checks
- **Source Maps**: Required for debugging
- **Output Directory**: `out/` for compilation, `dist/` for bundled production

### TypeScript Compiler Options

All TypeScript code must adhere to the strict configuration defined in `tsconfig.json`:

- `strict: true` (enables all strict type checking)
- `noImplicitAny: true`
- `noImplicitThis: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUnusedParameters: true`

## Code Formatting & Linting

### ESLint Configuration

- Use the project's ESLint configuration (`eslint.config.mjs`)
- **Required**: ESLint must pass with no warnings or errors before committing
- Key rules enforced:
  - `@typescript-eslint/naming-convention: warn`
  - `curly: warn` (always use curly braces)
  - `eqeqeq: warn` (use strict equality)
  - `@typescript-eslint/explicit-function-return-type: warn`
  - `@typescript-eslint/semi: warn` (semicolons required)

### Prettier Configuration

- Use Prettier for code formatting with the project's configuration
- **Print Width**: 80 characters maximum
- **End of Line**: Auto-detected
- JSON files use `json-stringify` parser
- Run `npm run lint:fix` to auto-fix formatting issues

## Naming Conventions

### Files and Directories

- **File Names**: PascalCase for TypeScript files (e.g., `ALCodeLine.ts`, `XliffFunctions.ts`)
- **Test Files**: `.test.ts` suffix (e.g., `Common.test.ts`)
- **Directory Names**: PascalCase for TypeScript source directories

### Code Elements

- **Classes**: PascalCase (e.g., `ALCodeLine`, `XlfHighlighter`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IOpenXliffIdParam`)
- **Functions**: camelCase (e.g., `formatDate`, `replaceAll`)
- **Variables**: camelCase (e.g., `lineNo`, `indentation`)
- **Constants**: camelCase for module-level exports (e.g., `userIdFile`, `userIdStateKey`)
- **Enums**: PascalCase with descriptive values (e.g., `TranslationMode`, `RefreshXlfHint`)
- **Types**: PascalCase (e.g., `TextDocumentMatch`)

## Function and Method Guidelines

### Function Declarations

- **Export Style**: Use explicit `export function` syntax
- **Return Types**: Always specify return types explicitly
- **Parameter Types**: Always specify parameter types
- **Documentation**: Use JSDoc comments for public APIs

Example:

```typescript
/**
 * Formats a date as YYYY-MM-DD
 * @param date Default Today
 * @returns YYYY-MM-DD formatted string
 */
export function formatDate(date = new Date()): string {
  // implementation
}
```

### Function Organization

- Group related functions in dedicated modules
- Keep functions focused and single-purpose
- Use helper functions to avoid code duplication
- Prefer pure functions when possible

## Class Design Patterns

### Class Structure

```typescript
export class ClassName {
  // Public properties first
  public publicProperty: string;

  // Private properties with explicit visibility
  private privateProperty: number;

  // Constructor
  constructor(param: string) {
    this.publicProperty = param;
  }

  // Static methods before instance methods
  static fromString(input: string): ClassName {
    // implementation
  }

  // Public methods
  public publicMethod(): boolean {
    // implementation
  }

  // Private methods last
  private privateMethod(): void {
    // implementation
  }
}
```

### Property and Method Access

- **Explicit Visibility**: Always specify `public`, `private`, or `protected`
- **Property Initialization**: Initialize properties at declaration when possible
- **Method Chaining**: Support fluent interfaces where appropriate

## Import and Module Organization

### Import Statements

- **VS Code API**: `import * as vscode from "vscode"`
- **Node.js Modules**: `import * as path from "path"`
- **Third-party Libraries**: Use specific imports when possible
- **Internal Modules**: Use relative paths with descriptive aliases

Example:

```typescript
// Standard libraries
import * as vscode from "vscode";
import * as path from "path";

// Third-party
import * as fs from "graceful-fs";
import * as uuid from "uuid";

// Internal modules with descriptive aliases
import * as NABfunctions from "./NABfunctions";
import * as SettingsLoader from "./Settings/SettingsLoader";
import { XlfHighlighter } from "./XlfHighlighter";
```

### Export Patterns

- **Functions**: Use `export function` for utilities
- **Classes**: Use `export class` for reusable components
- **Types/Interfaces**: Always export types used across modules
- **Enums**: Export enums that represent shared constants

## VSCode Dependency Restrictions

### CLI Tools and MCP Server Independence

**CRITICAL REQUIREMENT**: CLI tools and MCP server components MUST NOT have any dependency on the VSCode module.

The following components must remain VSCode-independent:

- `src/cli/CreateDocumentation.ts` → `cli/CreateDocumentation.js`
- `src/cli/RefreshXLF.ts` → `cli/RefreshXLF.js`
- `src/mcp/server.ts` → `mcp/server.js`

### Guidelines for VSCode-Independent Code

- **NO VSCode Imports**: Never import `vscode` module in CLI or MCP code
- **Shared Logic**: Extract shared functionality to common modules that don't depend on VSCode
- **Alternative APIs**: Use Node.js native APIs instead of VSCode equivalents:
  - Use `fs` instead of `vscode.workspace.fs`
  - Use `path` instead of `vscode.Uri`
  - Use `console.log` instead of VSCode output channels for CLI tools
- **Configuration**: Use file-based configuration instead of VSCode settings API

### Verification Process

Before committing changes to CLI or MCP components:

1. **Compile the project**: `npm run compile`
2. **Run dependency verification**: Execute the PowerShell script:
   ```powershell
   .\.github\workflows\scripts\vscode-dependency-test.ps1
   ```

This script automatically tests:

- CLI tools display usage information correctly
- MCP server starts without VSCode dependencies
- No "Cannot find module 'vscode'" errors occur

### Architectural Guidelines

- **Separation of Concerns**: Keep extension-specific logic separate from CLI/MCP logic
- **Dependency Injection**: Pass required data/functions as parameters rather than importing VSCode APIs
- **Interface Abstractions**: Create interfaces for functionality that differs between VSCode and standalone environments

### Example: Refactoring VSCode Dependencies

**❌ Wrong** (VSCode-dependent):

```typescript
import * as vscode from "vscode";

export function getWorkspacePath(): string {
  return vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
}
```

**✅ Correct** (VSCode-independent):

```typescript
import * as path from "path";

export function getWorkspacePath(workspacePath?: string): string {
  return workspacePath || process.cwd();
}
```

## Error Handling

### Error Types

- Use specific error types when available
- Provide meaningful error messages
- Include context in error messages (file paths, line numbers, etc.)
- Log errors appropriately using the project's logging framework

### Exception Handling

```typescript
try {
  // risky operation
} catch (error) {
  // Specific error handling with context
  throw new Error(`Failed to process file ${filePath}: ${error.message}`);
}
```

## Testing Guidelines

### Test File Structure

- **Location**: Place tests in `src/test/` directory
- **Naming**: Use `.test.ts` suffix
- **Organization**: Mirror source directory structure

### Test Writing Patterns

```typescript
import * as assert from "assert";
import * as ModuleUnderTest from "../ModuleUnderTest";

suite("ModuleUnderTest", function () {
  test("functionName - should do something specific", function () {
    // Arrange
    const input = "test input";
    const expected = "expected output";

    // Act
    const actual = ModuleUnderTest.functionName(input);

    // Assert
    assert.strictEqual(actual, expected, "Descriptive failure message");
  });
});
```

### Test Coverage Requirements

- Aim for high test coverage on business logic
- Test edge cases and error conditions
- Use descriptive test names that explain the scenario
- Group related tests in suites using `suite()` function

### Headless Testing Considerations

**Challenge**: The project's integration tests (`npm run test`) require VS Code's electron host and cannot run in pure headless environments.

**Solutions by Environment**:

1. **GitHub Actions CI**: Use `xvfb-action@v1` to provide virtual display

   ```yaml
   - name: Run tests
     uses: GabrielBB/xvfb-action@v1
     with:
       run: npm run test
   ```

2. **Coding Agents and Linux Servers**: Use xvfb manually
   ```bash
   # Run tests with virtual display
   xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npm run test
   ```

**Recommendation**: For automated environments, use `xvfb-run`.

## Documentation Standards

### JSDoc Comments

- **Public APIs**: Must have JSDoc comments
- **Complex Logic**: Add inline comments explaining the approach
- **Parameters**: Document all parameters with types and descriptions
- **Return Values**: Document what the function returns
- **Examples**: Provide examples for complex APIs

### Code Comments

- Explain **why**, not **what**
- Use comments sparingly for well-written code
- Update comments when code changes
- Remove obsolete comments

## Performance Considerations

### General Guidelines

- Avoid unnecessary object creation in loops
- Use appropriate data structures for the use case
- Cache expensive computations when possible
- Profile performance-critical code paths

### Async Patterns

- Use `async/await` for asynchronous operations
- Avoid blocking the VS Code UI thread
- Use appropriate Promise patterns for concurrent operations

## VS Code Extension Specific Guidelines

### Command Registration

- Register commands in `activate()` function
- Use descriptive command IDs matching `package.json`
- Group related commands together
- Provide user-friendly command titles

### Event Handling

- Clean up event listeners in `deactivate()`
- Use appropriate VS Code API events
- Handle errors gracefully in event handlers

### Configuration and Settings

- Use the Settings framework provided by the extension
- Validate settings values
- Provide reasonable defaults
- Document settings in `package.json`

## Build and Deployment

### Pre-commit Requirements

1. **Compilation**: `npm run test-compile` must complete without errors
2. **Linting**: `npm run lint` must pass without warnings (uses ESLint 9 flat config)
3. **Testing**: `npm run test` or `xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npm run test` must pass all tests
4. **Type Checking**: TypeScript compilation must succeed

### Development Workflow

- Use `npm run webpack` for bundled development builds
- Run tests frequently during development
- Check for circular dependencies using the provided task

## Security Guidelines

### Input Validation

- Validate all external inputs (files, user input, settings)
- Sanitize file paths and prevent directory traversal
- Handle malformed data gracefully

### File System Operations

- Use absolute paths when possible
- Check for file existence before operations
- Handle file system errors appropriately
- Respect file permissions and access rights

## Accessibility and Internationalization

### User Interface

- Use appropriate VS Code UI components
- Follow VS Code's accessibility guidelines
- Provide keyboard shortcuts for common operations

### Text and Messages

- Use clear, descriptive error messages
- Support the extension's translation framework
- Follow consistent terminology throughout the extension

---

_This document should be reviewed and updated as the project evolves. All team members, including GitHub Copilot, are responsible for maintaining these standards and suggesting improvements._
