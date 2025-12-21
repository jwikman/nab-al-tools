---
description: Guidelines for writing effective instruction files that Copilot will follow
applyTo: "**/instructions/*.instructions.md,**/prompts/*.prompt.md,**/agents/*.agent.md,!**/instructions/writing-instructions.instructions.md"
---

# Writing Effective Instructions for GitHub Copilot

Guidelines for creating instruction files that GitHub Copilot reliably follows.

## Core Principles

### 1. Don't Overthink It

- Instructions don't need to be perfect
- **Something is better than nothing**
- Instructions should evolve over time (living documents)
- Generative AI is probabilistic - tilt the scales, don't guarantee outcomes
- Start small and iterate based on results

### 2. Keep It Concise

- **Shorter is better** - Copilot works best with focused instructions
- **Limit: ~1000 lines max per file** (beyond this, quality deteriorates)
- **Target: 2 pages or less** for primary instructions
- Long files lead to inconsistent behavior
- Use multiple files to stay under limits

### 3. Clarity Over Completeness

- Clear, direct, simple language
- **Lists beat paragraphs** - Use bullet points
- Short, imperative directives (not narrative)
- Specific examples over abstract rules
- Structure matters for AI processing

### 4. Iterate and Refine

- Start with 10-20 specific instructions
- Test with real work
- Add one instruction at a time
- Remove what doesn't work
- Gather team feedback

---

## Essential Components

Every instruction file should include these 5 sections:

### 1. Project/Domain Overview (2-3 sentences)

**What to include:**

- What is this domain/area?
- Who uses it?
- What are key concepts?

**Example:**

```markdown
# AL Error Handling

Error handling in AL follows specific patterns for telemetry, user messaging,
and error recovery. This ensures consistent error experiences and proper logging.
```

### 2. Tech Stack / Technologies

**What to include:**

- Primary language/framework
- Key libraries or dependencies
- Testing frameworks
- Related systems or tools

**Example:**

```markdown
## Technologies

- AL for Business Central v27
- Business Central Test Tool
- Azure Application Insights
- AL-Go for CI/CD
```

### 3. Coding Guidelines

**Format as lists with specific rules:**

- Naming conventions (PascalCase, camelCase, etc.)
- Code style (indentation, line length)
- Architecture patterns
- Performance requirements
- Security standards

**Example:**

```markdown
## Naming Conventions

- **PascalCase**: Procedures, objects, enums
- **CamelCase**: Local variables, parameters
- **SCREAMING_SNAKE_CASE**: Global constants
- **Prefix objects**: Use app prefix "QWERE "
```

### 4. Common Patterns with Examples

**Provide templates showing correct usage:**

- Code structure templates
- Error handling patterns
- Testing patterns
- Integration patterns

**Always include code examples:**

````markdown
## Error Handling Pattern

```al
// Correct pattern
procedure ProcessData(var Rec: Record Customer)
begin
    if not Validate(Rec) then
        Error(ValidationFailedErr, Rec.FieldCaption("No."));

    Session.LogMessage('0001', ProcessFailedTxt, Verbosity::Error,
        DataClassification::SystemMetadata, TelemetryScope::All);
end;

// Avoid
procedure ProcessData(var Rec: Record Customer)
begin
    Rec.Modify();  // No validation, no error handling
end;
```
````

### 5. Project Structure / Available Resources

**Show where things are:**
- Folder organization
- File naming patterns
- Build scripts
- Test runners
- MCP servers
- Documentation

**Example:**
```markdown
## Project Structure

- `src/` - Main application code
  - `Common/` - Shared utilities
  - `Reconciliation/` - Core features
- `test/` - Automated tests

## Available Tools

- `bc-code-intel` MCP - BC knowledge base
- `ado` MCP - Azure DevOps integration
- `.AL-Go/` scripts - Build automation
````

---

## Writing Style

### Use Lists, Not Paragraphs

**❌ Avoid:**

```markdown
When writing error messages, you should ensure that they are clear and
actionable. The message should tell the user what went wrong and how to fix it.
```

**✅ Prefer:**

```markdown
## Error Messages

- Use clear, non-technical language
- State what went wrong
- Provide actionable next steps
- Include relevant context (ID, field name)
```

### Keep Sentences Short

**❌ Avoid:**

```markdown
In order to ensure proper performance when working with large datasets, it is
recommended that you utilize temporary tables to avoid database roundtrips.
```

**✅ Prefer:**

```markdown
## Performance

- Use temporary tables for large datasets
- Minimize database roundtrips
- Cache frequently accessed data
- Implement pagination for lists
```

### Make Instructions Actionable

**❌ Avoid vague directives:**

- "Write good code"
- "Follow best practices"
- "Be more accurate"
- "Identify all issues"

**✅ Be specific:**

```markdown
## Testing Requirements

- Write unit tests for all business logic
- Aim for 80%+ code coverage
- Test happy path and error scenarios
- Mock external dependencies
```

### Provide Concrete Examples

**Always show correct AND incorrect patterns:**

````markdown
## Naming Conventions

```al
// Correct
procedure CalculateTotal(SalesLine: Record "Sales Line"): Decimal
var
    totalAmount: Decimal;
begin
    // Clear, descriptive names
end;

// Avoid
procedure CalcTot(SL: Record "Sales Line"): Decimal
var
    amt: Decimal;
begin
    // Unclear abbreviations
end;
```
````
---

## File Organization

### Decision Matrix: When to Use What

| Use Case | copilot-instructions.md | *.instructions.md | Prompt Files |
|:----------|:------------------------|:-------------------|:--------------|
| General standards | ✅ Yes | ❌ No | ❌ No |
| Language-specific rules | ❌ No | ✅ Yes | ❌ No |
| Specific task workflows | ❌ No | ❌ No | ✅ Yes |
| Team conventions | ✅ Yes | ❌ No | ❌ No |
| Code generation style | ❌ No | ✅ Yes | ❌ No |

### Repository-Wide Instructions

**Use `copilot-instructions.md` for:**
- General team standards
- Universal security requirements
- Cross-cutting concerns (error handling philosophy)
- Documentation expectations
- Rules that apply to ALL files

**Location:** `.github/copilot-instructions.md`

**Example:**
```markdown
# General Code Review Standards

## Security Critical Issues

- Check for hardcoded secrets or API keys
- Validate all user inputs
- Use parameterized queries

## Code Quality

- Functions under 50 lines
- Clear, descriptive naming
- Proper error handling throughout
````

### Path-Specific Instructions

**Use `*.instructions.md` with `applyTo` frontmatter for:**

- Language-specific coding standards
- Framework-specific patterns
- Technology-specific security concerns
- Different rules for different parts of codebase

**Location:** `.github/instructions/<name>.instructions.md`

**Example:**

```markdown
---
applyTo: "**/*.al"
---

# AL Coding Standards

## Naming Conventions

- Use PascalCase for procedures
- Use camelCase for local variables

## Performance

- Use SetLoadFields for filtered queries
- Minimize database calls in loops
```

### Prompt Files (Task-Specific)

**Use `.prompt.md` files for:**

- Specific, repeatable tasks
- Reusable workflow templates
- Task-specific AI assistants

**Location:** `.github/prompts/<task>.prompt.md`

**Example:**

```markdown
---
mode: agent
tools: ["codebase", "githubRepo"]
description: Generate unit tests following AAA pattern
---

# Unit Test Generator

Generate unit tests using Arrange-Act-Assert pattern.

## Requirements

- Structure tests with AAA comments
- Test happy path and error scenarios
- Mock external dependencies
```

### Organizing Multiple Files

**Recommended structure:**

```
.github/
├── copilot-instructions.md          # General standards
├── instructions/
│   ├── al-code.instructions.md      # AL-specific (applyTo: **/*.al)
│   ├── testing.instructions.md      # Test-specific (applyTo: **/test/**/*.al)
│   └── security.instructions.md     # Security reviews
└── prompts/
    ├── unitTester.prompt.md         # Test generation
    ├── codeReview.prompt.md         # Review workflow
    └── securityAudit.prompt.md      # Security checks
```

### File Naming Conventions

Use consistent naming patterns to distinguish file types:

**Instruction files** (`*.instructions.md`): Use **kebab-case**

- `coding-guidelines.instructions.md`
- `translation-workflow.instructions.md`
- `security-review.instructions.md`

**Prompt files** (`*.prompt.md`): Use **camelCase**

- `translateXlfFiles.prompt.md`
- `reviewCodeChanges.prompt.md`
- `generateUnitTests.prompt.md`

**Agent files** (`*.agent.md`): Use **kebab-case**

- `code-reviewer.agent.md`
- `test-generator.agent.md`
- `security-auditor.agent.md`

**Rationale:**

- **camelCase for prompts**: Prompts are invoked by users in chat (e.g., `#prompt:translateXlfFiles`) where camelCase provides better readability without word separators and aligns with how they're referenced in IDE UI
- **kebab-case for instructions/agents**: These are documentation-like files that follow markdown/documentation file conventions and are automatically loaded rather than explicitly invoked
- **Visual distinction**: Different casing helps distinguish prompt files from instruction files at a glance

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
- Bare external URLs (always use markdown links for https://... URLs)
- ALL CAPS (except for constants in code)

### Clear Hierarchy

**Use consistent heading levels:**

- `#` - Main title
- `##` - Major sections
- `###` - Subsections
- `####` - Details (use sparingly)

**Example structure:**

```markdown
# Instruction File Title

Brief 2-3 sentence overview.

## Technologies

- Tech 1
- Tech 2

## Guidelines

### Category 1

- Guideline
- Guideline

### Category 2

- Guideline

## Common Patterns

### Pattern Name

[Example code]
```

---

## Advanced Techniques

### Context Layering Strategy

Use progressive refinement for complex requests:

**Layer 1 - High-level:**
"Using #codebase, understand our AL architecture"

**Layer 2 - Specific:**
"Focus on #file:Common.Codeunit.al for utility patterns"

**Layer 3 - Precise:**
"Using #selection, add error handling to this procedure"

### Conversation Continuity

Build on previous context across interactions:

```
# Initial request
"Create a new service following our patterns"

# Follow-up (retains context)
"Add comprehensive error handling to that service"

# Extension (builds on previous)
"Add unit tests covering all error scenarios"
```

### Progressive Enhancement

Start simple and iterate:

```
# Iteration 1: Basic functionality
"Create a simple CRUD service"

# Iteration 2: Add robustness
"Add error handling and logging"

# Iteration 3: Optimize
"Add caching and performance improvements"

# Iteration 4: Secure
"Review and enhance security"
```

### Ask for Missing Context

**Add to instructions:**

```markdown
## Interaction Guidelines

- Avoid making assumptions
- If you need additional context, ask the user
- Be specific about which context you need
- Always provide file names in responses
```

---

## What NOT to Include

### Unsupported Instructions

Copilot currently does NOT support instructions that attempt to:

**❌ Change UI/UX or formatting:**

- "Use bold text for critical issues"
- "Change font size"
- "Add emoji to comments"

**❌ Modify pull request overview:**

- "Include security summary in PR overview"
- "Add testing checklist to overview"

**❌ Change product behavior:**

- "Block PR from merging"
- "Generate changelog automatically"

**❌ Follow external links:**

- "Review according to standards at https://..."
- Workaround: Copy content into instruction file

**❌ Vague improvements:**

- "Be more accurate"
- "Don't miss any issues"
- "Be consistent"
- "Follow best practices"

### Anti-Patterns

**Avoid these patterns:**

**1. Generic Prompts:**

```markdown
❌ "Create a REST API"
✅ "Using #codebase patterns, create a REST API that follows our
authentication patterns and standard error handling"
```

**2. Context Overload:**

```markdown
❌ "Using #codebase #file:Service1.al #file:Service2.al #file:Service3.al"
✅ "Using #codebase, create a service following existing patterns"
```

**3. Expecting Perfection:**

```markdown
❌ Single request expecting perfect code
✅ Iterative refinement:

- "Create basic validation service"
- "Add comprehensive error handling"
- "Add unit tests for all scenarios"
```

**4. Set and Forget:**

```markdown
❌ Write once, never update
✅ Review and update monthly based on:

- Team feedback
- New patterns
- Evolving standards
```

---

## Testing & Iteration

### Start Small

Begin with 10-20 specific instructions addressing your most common needs.

### Test with Real Work

1. Create/update instructions
2. Use Copilot on real tasks
3. Note what works and what doesn't
4. Iterate based on results

### Track Effectiveness

**Metrics to monitor:**

- Code review time (before/after)
- Compliance violations
- Developer velocity
- Onboarding efficiency

**Prompt Performance:**

```markdown
## Prompt Performance Log

- unitTester.prompt.md: 95% success, saves 6 hours
- codeReview.prompt.md: 92% success, reduces review by 60%
```

### Refine Based on Results

**Common issues and fixes:**

```markdown
Issue: Generated code uses inconsistent error handling
Fix: Added explicit error handling templates
Result: 100% compliance with standards

Issue: Tests don't cover edge cases
Fix: Added specific test case requirements
Result: 95% increase in edge case coverage
```

---

## Recommended Template

Use this template as a starting point:

````markdown
---
applyTo: "**/*.al" # If path-specific
---

# [Technology/Domain Name] Guidelines

Brief 2-3 sentence overview of what this covers.

## Technologies

- Tech 1 - Description
- Tech 2 - Description

## Naming Conventions

- **PascalCase**: Classes, procedures
- **camelCase**: Variables
- **SCREAMING_SNAKE_CASE**: Constants

## Code Style

- Guideline 1
- Guideline 2

```al
// Example showing correct pattern
```
````

## Error Handling

- How to handle errors
- What patterns to use

```al
// Correct pattern example
```

## Testing

- Test requirement 1
- Test requirement 2

## Performance

- Performance guideline 1
- Performance guideline 2

## Security

- Security requirement 1
- Security requirement 2

## Available Tools

- Tool 1 - Purpose
- Tool 2 - Purpose

---

## Common Pitfalls

### 1. Too Long

**Problem:** Files over ~1000 lines
**Solution:** Break into multiple focused files

### 2. Too Vague

**Problem:** "Write good code", "Be accurate"
**Solution:** Specific, actionable directives with examples

### 3. Too Many Rules

**Problem:** Overwhelming with requirements
**Solution:** Start with 10-20 core instructions, expand gradually

### 4. Conflicting Instructions

**Problem:** Different files say opposite things
**Solution:** Review for conflicts, establish clear precedence

### 5. Outdated Content

**Problem:** Instructions become stale
**Solution:** Monthly review cycles, version control

### 6. Missing Examples

**Problem:** Abstract rules without demonstration
**Solution:** Include code examples for every pattern
---

## Validation Checklist

Before finalizing an instruction file:

- [ ] Has 2-3 sentence overview at top
- [ ] Uses list format for guidelines
- [ ] Includes concrete code examples
- [ ] No walls of text (broken into sections)
- [ ] Clear hierarchy with markdown headers
- [ ] Actionable guidance (not abstract)
- [ ] Under ~1000 lines
- [ ] Reasonable emphasis (not excessive CRITICAL/MUST)
- [ ] Proper markdown formatting
- [ ] `applyTo` pattern correct (if path-specific)
- [ ] Links work and reference correct files
- [ ] No conflicting instructions
- [ ] Tested with real work
- [ ] Examples show both correct and incorrect patterns

---

## Notes

- These guidelines apply to instruction and prompt files
- Evolve based on what works in practice
- **Less is often more** - don't over-prescribe
- Focus on helping Copilot help developers
- Instructions should make work easier, not harder
- **Iterate frequently** - treat as living documents
- Track metrics to validate effectiveness
- Share successful patterns across teams

**Sources:**

- [GitHub: 5 Tips for Better Custom Instructions](https://github.blog/ai-and-ml/github-copilot/5-tips-for-writing-better-custom-instructions-for-copilot/)
- [GitHub: Master Your Instructions Files](https://github.blog/ai-and-ml/unlocking-the-full-power-of-copilot-code-review-master-your-instructions-files/)
- [Complete Guide to Copilot Instructions](https://iamjeevan.com/blog/github-copilot-productivity-guide)
- [Azure with AJ: Prompts vs Instructions vs Chat Modes](https://azurewithaj.com/posts/github-copilot-prompt-instructions-chatmodes/)
- [Rafferty: Custom Prompts Structure](https://raffertyuy.com/raztype/ghcp-custom-prompts-structure/)
- [Burke: Essential Custom Instructions](https://burkeholland.github.io/posts/essential-custom-instructions/)
- [GitHub Docs: Use Custom Instructions](https://docs.github.com/en/copilot/tutorials/use-custom-instructions)

---
