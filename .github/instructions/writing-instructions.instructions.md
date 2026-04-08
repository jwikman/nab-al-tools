---
description: Guidelines for writing effective instruction files that Copilot will follow
applyTo: "**/instructions/*.instructions.md,**/prompts/*.prompt.md,**/agents/*.agent.md,!**/instructions/writing-instructions.instructions.md"
---

# Writing Effective Instructions for GitHub Copilot

Guidelines for creating instruction files that GitHub Copilot reliably follows.

## Core Principles

- **Max ~1000 lines per file** — quality deteriorates beyond this; split if needed
- **Target 2 pages or less** for primary instructions
- **Lists beat paragraphs** — use bullet points, not prose
- **Short imperative directives** — "Do X", not narrative explanations
- **Specific examples over abstract rules** — show correct AND incorrect patterns
- **Iterate and refine** — start small, test with real work, add one instruction at a time

---

## Essential Components

Every instruction file should include these 5 sections:

### 1. Domain Overview (2-3 sentences)

- What is this domain/area?
- Who uses it?
- What are key concepts?

### 2. Tech Stack / Technologies

- Primary language/framework
- Key libraries or dependencies
- Testing frameworks
- Related systems or tools

### 3. Coding Guidelines

Format as lists with specific rules:

- Naming conventions
- Code style
- Architecture patterns
- Performance requirements
- Security standards

### 4. Common Patterns with Examples

- Provide code templates showing correct usage
- Always show ✅ correct AND ❌ incorrect patterns
- Cover error handling, testing, integration patterns

### 5. Project Structure / Available Resources

- Folder organization
- File naming patterns
- Build scripts and test runners
- Available tools and MCP servers

---

## Writing Style

### Use Lists, Not Paragraphs

❌ "When writing error messages, you should ensure that they are clear and actionable."

✅

- Use clear, non-technical language
- State what went wrong
- Provide actionable next steps

### Keep Sentences Short

❌ "In order to ensure proper performance when working with large datasets, it is recommended that you utilize temporary tables."

✅

- Use temporary tables for large datasets
- Minimize database roundtrips

### Make Instructions Actionable

❌ Vague: "Write good code", "Follow best practices", "Be more accurate"

✅ Specific: "Write unit tests for all business logic", "Test happy path and error scenarios"

### Provide Concrete Examples

Always show correct AND incorrect patterns with code blocks.

---

## File Organization

### Decision Matrix

| Use Case                | copilot-instructions.md | \*.instructions.md | Prompt Files |
| :---------------------- | :---------------------- | :----------------- | :----------- |
| General standards       | ✅                      | ❌                 | ❌           |
| Language-specific rules | ❌                      | ✅                 | ❌           |
| Specific task workflows | ❌                      | ❌                 | ✅           |
| Team conventions        | ✅                      | ❌                 | ❌           |
| Code generation style   | ❌                      | ✅                 | ❌           |

### File Types

**`copilot-instructions.md`** — General team standards, universal security, cross-cutting concerns, rules for ALL files.
Location: `.github/copilot-instructions.md`

**`*.instructions.md`** — Language-specific standards, framework patterns, different rules for different code areas.
Location: `.github/instructions/<name>.instructions.md`
Requires `applyTo` frontmatter (e.g., `applyTo: "**/*.al"`).

**`*.prompt.md`** — Specific, repeatable tasks and workflow templates.
Location: `.github/prompts/<task>.prompt.md`
Requires `mode` and `tools` frontmatter.

### File Naming Conventions

**Instruction files** (`*.instructions.md`): **kebab-case**

- `coding-guidelines.instructions.md`
- `translation-workflow.instructions.md`

**Prompt files** (`*.prompt.md`): **camelCase**

- `translateXlfFiles.prompt.md`
- `reviewCodeChanges.prompt.md`

**Agent files** (`*.agent.md`): **kebab-case**

- `code-reviewer.agent.md`
- `test-generator.agent.md`

**Rationale:**

- **camelCase for prompts**: Invoked in chat (e.g., `#prompt:translateXlfFiles`) — camelCase provides readability
- **kebab-case for instructions/agents**: Documentation-like files, automatically loaded
- **Visual distinction**: Different casing helps distinguish file types at a glance

---

## Formatting Standards

### Markdown Best Practices

**Use proper markdown:**

- `**bold**` for emphasis
- `- ` for unordered lists
- `1. ` for ordered lists (auto-numbered)
- ` ```language ` for code blocks
- `[text](url)` for links
- `<placeholders>` for variables

**Avoid:**

- Excessive emphasis (CRITICAL, MUST everywhere)
- Nested bold/italic (`***text***`)
- Manual list numbering
- Bare external URLs (always use markdown links)
- ALL CAPS (except for constants in code)

---

## What NOT to Include

Copilot does NOT support instructions that attempt to:

**❌ Change UI/UX or formatting:**

- "Use bold text for critical issues"
- "Add emoji to comments"

**❌ Control product behavior:**

- "Block PR from merging"
- "Generate changelog automatically"

**❌ Reference external URLs:**

- "Review according to standards at https://..."
- Workaround: Copy relevant content into the instruction file

**❌ Vague directives:**

- "Be more accurate"
- "Don't miss any issues"
- "Follow best practices"
