---
agent: nab-al-tools-agent
description: "Finalize pull request documentation by updating README, CHANGELOG, and docs folder with comprehensive feature documentation."
argument-hint: "[PR number, link or description]"
---

# Finalize Pull Request Documentation

Update all documentation for a pull request before merging, ensuring consistency across README.md, CHANGELOG.md, and the docs/ folder.

This prompt invokes the **NAB-AL-Tools-Agent** to systematically review and update all documentation following the **[Documentation Writing Guidelines](../instructions/documentation-writing.instructions.md)**.

## What This Prompt Does

The agent will:

1. **Review Changes**: Analyze the pull request to identify all features, fixes, and changes
2. **Update CHANGELOG.md**: Add properly formatted entries under the appropriate version section
3. **Update README.md**: Add or update high-level feature descriptions, table of contents, and quick start information
4. **Update/Create Documentation**: Create or update detailed documentation in the `docs/` folder following the established structure
5. **Verify Consistency**: Ensure terminology, formatting, and cross-references are consistent across all documentation
6. **Validate Links**: Check that all internal and external links work correctly
7. **Review Examples**: Ensure code examples are accurate and follow current API patterns

## Usage Examples

```
/finalizePullRequest #123
```

```
/finalizePullRequest Add local glossary support
```

```
/finalizePullRequest Review and update docs before merge
```

## Documentation Guidelines

The agent follows the comprehensive **[Documentation Writing Guidelines](../instructions/documentation-writing.instructions.md)** which cover:

- **Update Checklist**: CHANGELOG.md format, README.md updates, docs/ folder structure, cross-file consistency, and quality checks
- **Documentation Structure**: Feature docs, guides, reference material, and troubleshooting organization
- **Writing Style**: Tone, terminology, formatting conventions, and content guidelines
- **Maintenance**: When to update, update checklist, and cross-file consistency requirements

Refer to the instruction file for complete details on documentation standards and best practices.

## When to Use This Prompt

Use this prompt:

- ✅ Before merging any pull request with user-facing changes
- ✅ After completing feature development
- ✅ When adding new settings or commands
- ✅ When fixing bugs that affect documented workflows
- ✅ When deprecating features or making breaking changes
- ✅ After adding Language Model Tools or MCP server features

## Expected Output

The agent will provide:

1. **Updated CHANGELOG.md** with proper formatting and links
2. **Updated README.md** with high-level feature information
3. **New/Updated docs/** with comprehensive feature documentation
4. **Verification Report** showing:
   - What was updated and why
   - Links checked and validated
   - Code examples tested
   - Cross-reference consistency verified
5. **Suggested Improvements** if any documentation gaps are identified

## Related Documentation

- [Documentation Writing Guidelines](../instructions/documentation-writing.instructions.md)
- [Coding Guidelines](../instructions/coding-guidelines.instructions.md)
- [Agent Instructions](../copilot-instructions.md)

## Tips for Best Results

- Provide context about the changes (feature, bugfix, breaking change)
- Reference the PR number or issue number for automatic analysis
- Mention if specific documentation sections need extra attention
- Point out any complex features that need detailed examples
- Highlight any breaking changes that need migration guides

---
