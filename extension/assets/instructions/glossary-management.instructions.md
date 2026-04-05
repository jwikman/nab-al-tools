---
name: glossary-management
description: "Instructions for managing Business Central AL glossary files - create, add languages, review, and validate terminology"
---

# Glossary Management Instructions

Comprehensive instructions for managing Business Central AL glossary files using NAB AL Tools.

## Reading Tool Results

Tool results may be written to disk when they exceed ~8KB. When this happens:

1. Use `read_file` with `startLine=1, endLine=2000` to read the full content
2. If the file is larger than 2000 lines, continue with additional `read_file` calls using the next range
3. Always read the complete tool result before processing — do not rely on truncated previews

## Overview

TSV file containing Business Central terminology translations. Ensures consistent translation across XLF files with contextual descriptions.

## Glossary File Structure

### Format Specification

- **Format**: TSV (tab-separated values), UTF-8 encoded
- **Line Endings**: CRLF (Windows) or LF (Unix/Mac)
- **Location**: Project root or `extension/resources/glossary.tsv`

### Column Structure

1. **`en-US`** (first, required) — English source term, unique, case-sensitive
2. **Language columns** (middle) — locale codes (e.g., `da-DK`, `sv-SE`), empty cells allowed
3. **`Description`** (last, optional but recommended) — context, usage notes, BC module info

### Example Structure

```tsv
en-US	da-DK	sv-SE	de-DE	Description
Analysis View	Analysevisning	Analysvy	Analyseansicht	Aggregated dimension analysis snapshot (Finance). Pre-processed grouping of G/L entries by dimensions to speed reporting
Bank Account	Bankkonto	Bankkonto	Bankkonto	Master record (Finance/Cash Mgmt). Represents a company bank ledger; used for payments, reconciliation, cash flow
```

## Glossary Operations

### 1. Create New Glossary File

**When to use**: Starting a new project or replacing an existing glossary.

#### Workflow

1. **Determine Languages** — ask user; default: `en-US` + at least one target. Common: `da-DK`, `sv-SE`, `nb-NO`, `de-DE`, `fr-FR`

2. **Check for XLF Files** — look for existing XLF files for selected languages

   - If none: offer to create via `createLanguageXlf`
   - If user declines: proceed with empty glossary or built-in BC terms only

3. **Determine Location** — ask user; suggest project root or `resources/`; default: `glossary.tsv`

4. **Create Structure** — header: `en-US` → language columns → optional `Description`; tab-separated

5. **Add Seed Terms**:
   - Option 1: Empty (header only)
   - Option 2: Common BC terms from existing glossary
   - Option 3: Extract from existing XLF files (see Extraction Strategy)
   - Recommend 20-50 core terms minimum

#### Extraction Strategy from XLF Files

1. **Prepare Source Data** — run `refreshXlf`, call `getTranslatedTextsMap` or `getTranslatedTextsByState` for all translations

2. **Identify Glossary Candidates** (by priority):

   - **High**: Technical terms (object names, domain fields, BC concepts), multi-word phrases (2-4 words)
   - **Medium**: Terms appearing 3+ times, capitalized terms, domain vocabulary (finance, inventory, manufacturing)

3. **Filter Out**:

   - Terms already in built-in glossary (check via `getGlossaryTerms`)
   - Common words, generic UI terms (OK, Cancel), <3 char texts, full sentences >100 chars, placeholder-heavy texts, date/number formats

4. **Score and Rank** (highest to lowest): Built-in BC terms → object names → multi-word phrases → frequent terms → capitalized terms. Review top 50-100.

5. **Review with User** — show term, frequency, trans-unit types, grouped by category. Allow interactive add/remove.

6. **Generate Descriptions** from XLF metadata, AL source, BC knowledge base. Format: `[Purpose/Usage]. [Differentiation].` Keep 50-150 chars.

7. **Validate** — verify header, tab separation, UTF-8, en-US first column

#### Quality Checks

- [ ] Header row present with column names
- [ ] `en-US` is first column
- [ ] `Description` is last column (if present - recommended)
- [ ] All language codes are valid locale identifiers
- [ ] No duplicate en-US terms
- [ ] File uses tab separators (not spaces or commas)

### 2. Add Language to Existing Glossary

**When to use**: Expanding glossary to support additional languages.

#### Workflow

1. **Read existing glossary** — parse header, verify structure
2. **Validate new language** — get code from user, check not duplicate, validate format (xx-XX)
3. **Check for XLF files** — if none exist for target language, offer `createLanguageXlf`
4. **Determine column position** — after `en-US`, before `Description` (if exists), alphabetical recommended
5. **Add column** — insert in header, add empty cells in data rows, maintain tab separation
6. **Optional: Populate** — translate existing terms or extract from XLF
7. **Validate** — consistent column count, existing data unchanged, encoding preserved

#### Quality Checks

- [ ] Language code valid and not duplicate
- [ ] Column count consistent across all rows
- [ ] Existing data unchanged, tab separators maintained, UTF-8 preserved

### 3. Review Glossary

**When to use**: Quality assurance, consistency checks, gap identification.

#### Review Types

**A. Structural**: Column consistency, tab-only separators, valid headers (`en-US`, `Description`), valid language codes, UTF-8, consistent line endings

**B. Data Quality**: No duplicates in en-US, no empty required fields, translation completeness %, description quality, consistency patterns

**C. Terminology**: Consistent capitalization/punctuation per language, reasonable term length, context alignment, BC standard terminology alignment

#### Review Workflow

1. Parse file, build term index, count translations per language
2. Run checks, collect issues by severity (error/warning/info)
3. Report: statistics, errors, warnings, improvement suggestions
4. Offer automatic fixes for structural issues, suggest corrections for data issues

#### Quality Metrics (per language)

- Coverage %, empty cell count, consistency score, description completeness

### 4. Validate Glossary Structure

**When to use**: Before translation workflow, after manual edits.

#### Validation Checks

1. **File Format** — exists, readable, UTF-8, tab-separated
2. **Header** — first column `en-US`, last `Description` (if present), valid language codes, no duplicates
3. **Data Integrity** — consistent column count, no duplicate/empty en-US, no empty Descriptions (if column exists)
4. **Content** — descriptions ≥20 chars (if present), no tabs in translations, no unintentional HTML/XML

#### Results

- **PASS**: Valid and ready
- **FAIL**: Critical errors prevent usage
- **WARNING**: Should be addressed but don't block

Offer automatic fixes, re-validate after applying.

## Integration with Translation Workflow

### Loading

1. Local glossary (project's glossary.tsv) — takes precedence
2. Extension glossary (NAB AL Tools resources)

### Application

- Exact match lookup, longest match first
- Case-sensitive preferred, case-insensitive fallback
- Preserve term boundaries (no partial word matches)

### Priority

1. Multi-word phrases over single words
2. Exact case over case-insensitive
3. Local glossary over extension glossary

## Best Practices

- **Content**: Focus on domain terms (not common words), provide context in descriptions, one concept per line, align with Microsoft's official translations
- **Maintenance**: Version-control glossary.tsv, review changes in PRs, document additions, periodic reviews
- **Translation**: Use glossary terms exactly, consider description context, aim for 100% coverage, prioritize quality

## Common Issues

| Issue                   | Solution                                                     |
| ----------------------- | ------------------------------------------------------------ |
| Duplicate en-US terms   | Merge if same concept, differentiate if different            |
| Inconsistent separators | Use proper TSV editor; verify column count matches header    |
| Missing descriptions    | Add module name + term type (minimum); usage context (ideal) |
| Incomplete coverage     | Prioritize by frequency; use translation tools, then review  |
| Encoding problems       | Save as UTF-8 (no BOM); re-save if special chars corrupted   |

## Tools

- **getGlossaryTerms** — fetches glossary terms for a specific language, returns filtered subset, used automatically during XLF translation

---

**Note**: Referenced by NAB-XLF-Translator agent via `manageGlossary.prompt.md`. Follow these guidelines for all glossary operations.
