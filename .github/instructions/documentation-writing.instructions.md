---
description: Guidelines for writing effective user-oriented documentation for NAB AL Tools
applyTo: "**/docs/**/*.md,!**/docs/README.md"
---

# Writing User-Oriented Documentation for NAB AL Tools

Guidelines for creating clear, helpful, and maintainable user documentation for NAB AL Tools extension users.

## Core Principles

### 1. User-First Approach

- Write for Business Central developers and consultants
- Assume familiarity with AL language and Business Central concepts
- Don't assume knowledge of NAB AL Tools-specific features
- **Show, don't just tell** - Use examples and visuals
- Focus on solving real problems, not just listing features

### 2. Maintain Consistency

- Follow the tone and style of existing documentation (README.md, CHANGELOG.md)
- Use consistent terminology throughout all documentation
- Keep formatting patterns uniform across all docs
- Reference related features with proper links

### 3. Keep Documentation Current

- Update docs when features change
- Remove or mark deprecated features clearly
- Include version information for version-specific features
- Review and update examples to match current API

### 4. Balance Detail with Brevity

- Be comprehensive but not overwhelming
- Use progressive disclosure (overview → details → advanced)
- Link to related documentation instead of repeating content
- Break complex topics into digestible sections

---

## Documentation Structure

### File Organization

User documentation should be organized in the `docs/` folder with this structure:

```
docs/
├── features/              # Feature-specific documentation
│   ├── xliff-tools.md    # XLIFF translation management
│   ├── language-model.md # AI/LLM integration
│   ├── documentation.md  # Auto-documentation features
│   └── ...
├── guides/                # Step-by-step tutorials
│   ├── getting-started.md
│   ├── translation-workflow.md
│   └── ...
├── reference/             # Technical reference material
│   ├── settings.md       # All extension settings
│   ├── commands.md       # All commands
│   └── ...
└── troubleshooting/       # Common issues and solutions
    └── ...
```

### Document Types

#### Feature Documentation

**Purpose:** Explain what a feature does, why it exists, and how to use it

**Structure:**
```markdown
# Feature Name

Brief 1-2 sentence description of what the feature does.

## Overview

2-3 paragraphs explaining:
- The problem this feature solves
- When to use it
- Key capabilities

## How to Use

Step-by-step instructions with:
- Prerequisites (if any)
- Clear numbered steps
- Expected outcomes

## Examples

Real-world usage examples with:
- Context/scenario
- Code or screenshots
- Results

## Related Features

Links to:
- Complementary features
- Related settings
- Relevant guides

## Troubleshooting

Common issues and solutions
```

#### Guide Documentation

**Purpose:** Walk users through complete workflows or complex tasks

**Structure:**
```markdown
# Guide Title

What this guide helps you accomplish.

## Prerequisites

- Required knowledge
- Required setup
- Required extensions/settings

## Step-by-Step Instructions

### Step 1: [Action]
Detailed instructions...

### Step 2: [Action]
Detailed instructions...

## Best Practices

Tips for optimal results

## Common Pitfalls

What to avoid and why

## Next Steps

What to do after completing this guide
```

#### Reference Documentation

**Purpose:** Provide comprehensive technical details

**Structure:**
```markdown
# Reference Title

Brief description.

## [Item Name]

**Type:** [Setting/Command/API]
**Default:** [Value]
**Since:** v[Version]

Description of what it does.

**Example:**
```json or code example```

**Related:**
- Links to related items
```

---

## Writing Style Guidelines

### Tone and Voice

- **Professional but friendly** - Speak directly to developers
- **Active voice** - "Click the button" not "The button should be clicked"
- **Imperative mood for instructions** - "Run the command" not "You should run"
- **Present tense** - "This feature provides" not "This feature will provide"
- Avoid jargon unless it's standard Business Central terminology

### Terminology

**Use Consistently:**

- **XLF file** or **XLIFF file** (not "translation file" alone)
- **g.xlf file** (not "generated xlf" or "base xlf")
- **trans-unit** or **translation unit** (not "translation entry")
- **AL code** or **AL language** (not just "code")
- **Language Model Tools** (capitalized, for the VS Code API feature)
- **MCP server** (not "MCP Server")
- **Base App** or **BaseApp** (Microsoft's base application)

**Avoid:**

- "Simply" or "just" (what's simple to one person may not be to another)
- "Obviously" or "clearly" (don't assume)
- "Easy" or "trivial" (subjective)
- Unexplained acronyms on first use

### Formatting Conventions

#### Code and Commands

- **Inline code:** Use backticks for: `` `settings` ``, `` `commands` ``, `` `filenames.xlf` ``, `` `code snippets` ``
- **Code blocks:** Use fenced code blocks with language identifiers

```al
// AL code example
procedure MyProcedure()
begin
    Message('Hello World');
end;
```

```json
// JSON configuration
{
    "NAB.SettingName": true
}
```

#### UI Elements

- **Commands:** Use the exact command name with backticks and bold: **`NAB: Refresh XLF files from g.xlf`**
- **Settings:** Use the exact setting name with backticks: `NAB.UseTargetStates`
- **Keyboard shortcuts:** Use format: `Ctrl+Alt+U` or `Cmd+Shift+P`
- **Menu paths:** Use format: Command Palette → NAB: Command Name

#### Links

- **Internal links:** Use relative paths: `[Feature Name](features/xliff-tools.md)`
- **External links:** Always use descriptive text: `[GitHub Issues](https://github.com/jwikman/nab-al-tools/issues)`
- **Cross-references:** Link to related sections: "See also: [Translation Workflow](guides/translation-workflow.md)"

#### Lists

- Use **bullet points** for unordered information
- Use **numbered lists** for sequential steps
- Keep list items parallel in structure
- Start each item with a capital letter
- End items with periods if they're complete sentences

#### Emphasis

- **Bold** for important concepts or UI elements
- *Italic* for emphasis (use sparingly)
- > Quote blocks for tips, warnings, or notes

**Example:**

> **Note:** This feature requires Business Central v21 or later.

> **Warning:** This operation cannot be undone. Make sure to commit your changes first.

> **Tip:** Use the keyboard shortcut `Ctrl+Alt+U` for faster navigation.

---

## Content Guidelines

### Examples and Visuals

#### Code Examples

- **Keep examples simple** - Focus on one concept at a time
- **Include context** - Show where the code fits in a larger structure
- **Show both correct and incorrect** - Use "Do" and "Avoid" sections
- **Add comments** - Explain non-obvious parts
- **Test all examples** - Ensure they actually work

**Example:**

```al
// Do: Clear error message with context
if CustomerNo = '' then
    Error('Customer number must be specified.');

// Avoid: Vague error message
if CustomerNo = '' then
    Error('Invalid input.');
```

#### Screenshots and GIFs

- Use GIFs for demonstrating workflows (as in current README.md)
- Use static screenshots for showing UI elements or results
- Keep file sizes reasonable (compress large images)
- Store images in `images/` folder
- Use descriptive filenames: `xliff-translation-workflow.gif`
- Include alt text for accessibility

```markdown
![XLIFF translation workflow](images/gifs/RefreshFromGXlf.gif)
```

### Prerequisites and Requirements

Always specify:
- Required VS Code version (if applicable)
- Required AL Language extension version (if applicable)
- Required Business Central version (if applicable)
- Required settings or configuration
- Required file structure

### Version-Specific Information

When documenting version-specific features:

```markdown
**Since:** v1.45

This feature requires Business Central v23 or later.
```

For deprecated features:

```markdown
**Deprecated:** v1.45
**Replacement:** Use `NAB.UseTargetStates` instead.

This setting is deprecated and will be removed in v2.0.
```

---

## Special Sections

### Troubleshooting

Structure troubleshooting content as:

1. **Problem description** - Clear, specific symptom
2. **Cause** - Why this happens (if known)
3. **Solution** - Step-by-step fix
4. **Prevention** - How to avoid in the future

**Example:**

#### Translation units not updating after compilation

**Problem:** After building your app, the g.xlf file doesn't reflect recent changes to labels and captions.

**Cause:** The AL compiler caches translations and may not regenerate the g.xlf file if it thinks nothing has changed.

**Solution:**
1. Clean your project: `Ctrl+Shift+P` → "AL: Clean"
2. Delete the `objcache` folder in your project
3. Rebuild your app

**Prevention:** Use **`NAB: Update g.xlf`** when making changes without full compilation.

### Settings Documentation

For each setting, include:

- **Setting name** (exact)
- **Type** (boolean, string, array, object)
- **Default value**
- **Description** (what it does)
- **When to use it** (use cases)
- **Example** (configuration example)
- **Related settings** (if any)

**Example:**

#### `NAB.UseTargetStates`

**Type:** `boolean`
**Default:** `false`
**Since:** v1.45

When enabled, the extension uses XLIFF target state attributes (like 'translated', 'needs-translation') instead of [NAB: *] tags.

**When to use:**
- Working with external translation tools that understand XLIFF states
- Using Copilot-assisted translations
- Any workflow that benefits from XLIFF standard state management

**Example:**

```json
{
    "NAB.UseTargetStates": true
}
```

**Related:**
- [NAB: Refresh XLF files from g.xlf](features/xliff-tools.md#refresh-xlf)
- [Translation Workflow Guide](guides/translation-workflow.md)

---

## Documentation Maintenance

### When to Update Documentation

Update documentation when:

- ✅ Adding a new feature
- ✅ Changing existing feature behavior
- ✅ Deprecating a feature or setting
- ✅ Fixing a bug that affects user workflows
- ✅ Adding new settings or commands
- ✅ Changing default values
- ✅ Users report confusion or ask frequent questions

### Update Checklist

When updating documentation:

- [ ] Update feature documentation in `docs/features/`
- [ ] Update relevant guides in `docs/guides/`
- [ ] Update reference documentation in `docs/reference/`
- [ ] Update `README.md` if it's a major feature
- [ ] Add entry to `CHANGELOG.md`
- [ ] Update code examples to match current API
- [ ] Verify all links still work
- [ ] Test all code examples
- [ ] Update version numbers where applicable

### Cross-File Consistency

When documenting a feature, ensure consistency across:

1. **CHANGELOG.md** - Brief description of what changed
2. **README.md** - High-level feature overview and quick start
3. **Feature docs** - Comprehensive explanation and examples
4. **MCP_SERVER.md** - Tool definitions and schemas (if applicable)
5. **Settings** - In-editor setting descriptions in `package.json`

---

## Common Patterns

### Documenting a New Feature

1. Add entry to CHANGELOG.md under appropriate category
2. Update README.md table of contents
3. Add section to README.md with overview
4. Create detailed feature doc in `docs/features/`
5. Add to relevant guide in `docs/guides/` (if applicable)
6. Update reference documentation in `docs/reference/`

### Documenting a Breaking Change

1. Mark clearly in CHANGELOG.md with **Breaking Change** label
2. Explain what breaks and why
3. Provide migration path
4. Update all affected documentation
5. Consider adding migration guide

**Example:**

```markdown
- Changed:
  - **Breaking Change**: Updated `toolReferenceName` values for all Language Model Tools.
    The new reference names are: `refreshXlf`, `getTextsToTranslate`, etc.

    **Migration:** Update any instruction files or prompts that reference these tools
    to use the new names without the `nab-al-tools-` prefix.
```

### Documenting Settings

Always follow this pattern in feature documentation:

```markdown
## Configuration

This feature can be configured using the following settings:

### `NAB.SettingName`

Description of what the setting controls.

**Default:** `false`

**Example:**

```json
{
    "NAB.SettingName": true,
    "NAB.RelatedSetting": "value"
}
```

**See also:** [Full Settings Reference](../reference/settings.md#settingname)
```

---

## Quality Checklist

Before publishing documentation:

- [ ] **Accuracy:** All information is correct and tested
- [ ] **Completeness:** All necessary information is included
- [ ] **Clarity:** Instructions are clear and unambiguous
- [ ] **Consistency:** Formatting and terminology match existing docs
- [ ] **Links:** All links work correctly
- [ ] **Examples:** All code examples are tested and work
- [ ] **Grammar:** No spelling or grammatical errors
- [ ] **Visual aids:** Screenshots/GIFs are clear and relevant
- [ ] **Version info:** Version-specific features are marked
- [ ] **Cross-references:** Related docs are linked

---

## Examples of Good Documentation

### Good Feature Description

```markdown
## NAB: Find next untranslated text

Quickly navigates to the next translation that needs attention. This feature helps
you efficiently work through all translations that require review or completion.

**Keyboard shortcut:** `Ctrl+Alt+U`

### Behavior

When `NAB.UseTargetStates` is `false` (default):
- Searches for `[NAB: NOT TRANSLATED]`, `[NAB: REVIEW]`, or `[NAB: SUGGESTION]` tags
- Selects the tag and surrounding context for easy editing

When `NAB.UseTargetStates` is `true`:
- Searches for targets with state attributes requiring attention
- Includes states: `new`, `needs-translation`, `needs-adaptation`, `needs-review-translation`

### Usage

1. Open any XLF file in your project
2. Press `Ctrl+Alt+U` or run **`NAB: Find next untranslated text`**
3. The cursor moves to the next item needing attention
4. Update the translation
5. Repeat until all translations are complete

**Tip:** Use this command repeatedly to process all translations in a file efficiently.
```

### Good Troubleshooting Entry

```markdown
### Error: "Cannot find g.xlf file"

**Problem:** Running **`NAB: Refresh XLF files from g.xlf`** shows error: "Cannot find g.xlf file".

**Cause:** The g.xlf file hasn't been generated yet, or it's in an unexpected location.

**Solution:**

1. Build your AL project: `Ctrl+Shift+B` or `F5`
2. Verify the g.xlf file exists in your `Translations/` folder
3. Check your `app.json` has correct `name` field (g.xlf is named `<appname>.g.xlf`)

If the g.xlf file is in a custom location:
- Use **`NAB: Update g.xlf`** to generate it without full compilation

**See also:** [XLIFF Tools Overview](../features/xliff-tools.md)
```

---

## Anti-Patterns to Avoid

### ❌ Don't: Assume Knowledge

```markdown
<!-- Bad -->
Just run the refresh command and match the translations.

<!-- Good -->
1. Open the Command Palette (`Ctrl+Shift+P`)
2. Run **`NAB: Refresh XLF files from g.xlf`**
3. The command will automatically match translations from BaseApp if `NAB.MatchTranslation` is enabled
```

### ❌ Don't: Be Vague

```markdown
<!-- Bad -->
This setting improves translation handling.

<!-- Good -->
This setting enables automatic matching of translations from Microsoft's BaseApp,
reducing manual translation work for common Business Central terms.
```

### ❌ Don't: Over-Explain Basics

```markdown
<!-- Bad -->
First, you need to open VS Code, which is a code editor from Microsoft. Then you
need to install the AL Language extension, which provides support for AL language...

<!-- Good -->
**Prerequisites:**
- VS Code with AL Language extension
- Business Central AL project
```

### ❌ Don't: Forget Context

```markdown
<!-- Bad -->
Set the value to true.

<!-- Good -->
Set `NAB.UseTargetStates` to `true` in your VS Code settings to enable XLIFF state
management instead of using [NAB: *] tags.
```

---

## Getting Help

If you're unsure about documentation style or structure:

1. Review existing documentation in README.md and CHANGELOG.md
2. Check similar features for pattern examples
3. Ask for feedback in pull requests
4. Reference this guide for standards

Remember: **Good documentation evolves**. Start with something helpful, get feedback, and iterate.
