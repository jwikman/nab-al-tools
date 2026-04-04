---
name: glossary-management
description: "Instructions for managing Business Central AL glossary files - create, add languages, review, and validate terminology"
---

# Glossary Management Instructions

Comprehensive instructions for managing Business Central AL glossary files using NAB AL Tools.

## Overview

The glossary file is a tab-separated values (TSV) file containing Business Central terminology translations. It serves as a reference for consistent translation across all XLF files and provides contextual descriptions for technical terms.

## Glossary File Structure

### Format Specification

- **File Format**: Tab-separated values (TSV)
- **Encoding**: UTF-8
- **Line Endings**: CRLF (`\r\n`) on Windows, LF (`\n`) on Unix/Mac
- **Location**: Typically in project root or `extension/resources/glossary.tsv`

### Column Structure

#### Required Columns

1. **`en-US`** (First column, always required)
   - English source term
   - Primary key for glossary lookups
   - Must be unique (no duplicate entries)
   - Case-sensitive for matching

#### Optional Columns

2. **`Description`** (Last column, recommended)
   - Technical context and usage notes
   - Explains when and how to use the term
   - Differentiates similar terms
   - Provides Business Central module context
   - **Note**: Optional but highly recommended, especially when generating new glossary files

#### Language Columns

- **Position**: Between `en-US` and `Description` (if Description column exists)
- **Naming**: Use locale codes (e.g., `da-DK`, `sv-SE`, `de-DE`)
- **Content**: Translated term for that language
- **Empty cells**: Allowed (indicates term not yet translated for that language)

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

1. **Determine Languages**

   - Ask user which languages to include
   - Default: `en-US` (source) + at least one target language
   - Common starting languages: `da-DK`, `sv-SE`, `nb-NO`, `de-DE`, `fr-FR`

2. **Check for XLF Files**

   - Look for existing XLF files in the Translations folder for the selected languages
   - **If no XLF files exist for the target language(s)**:
     - Offer to create new language XLF file(s) using `createLanguageXlf`
     - Explain: "To populate the glossary with app-specific terms, you'll need translation files. Would you like me to create XLF file(s) for [language codes]?"
     - If user accepts: Create XLF files first, then proceed with glossary creation
     - If user declines: Proceed with empty glossary or use built-in BC terms only

3. **Determine Location**

   - Ask user for file location
   - Suggested: Project root or `resources/` folder
   - Default filename: `glossary.tsv`

4. **Create Structure**

   - First column: `en-US`
   - Middle columns: Target language codes (one per language)
   - Optional last column: `Description` (recommended for new glossaries)
   - Use tab characters (`\t`) as separators

5. **Add Seed Terms**
   - Option 1: Start with empty file (header only)
   - Option 2: Add common Business Central terms from existing glossary
   - Option 3: Extract terms from existing XLF files (see Extraction Strategy below)
   - Recommend starting with at least 20-50 core terms

#### Extraction Strategy from XLF Files

When creating a glossary from existing XLF translations:

1. **Prepare Source Data**

   - Run `refreshXlf` on target language file(s)
   - Call `getTranslatedTextsMap` or `getTranslatedTextsByState` to fetch all translations (any state)
   - Extract source (en-US) texts from results

2. **Identify Glossary Candidates**

   Analyze source texts to identify terms worth including in glossary using these criteria:

   **A. Technical Terms (High Priority)**

   - Object names (Table, Page, Report names), domain-specific field names, BC-specific concepts
   - Identify via trans-unit `id` attribute and `note` elements

   **B. Multi-Word Phrases (High Priority)**

   - Compound terms (2-4 words) forming a single concept — need consistent translation across all occurrences

   **C. Frequently Repeated Terms (Medium Priority)**

   - Terms appearing 3+ times across the XLF — higher frequency means greater consistency impact

   **D. Capitalized Terms (Medium Priority)**

   - Proper nouns and technical terms indicating BC-specific terminology

   **E. Domain-Specific Vocabulary (Medium Priority)**

   - Finance, inventory, manufacturing terms (e.g., "General Ledger", "Bin Content", "Work Center")

3. **Filter Out Non-Glossary Terms**

   Exclude these categories:

   - **Terms already in built-in glossary**: Check against `getGlossaryTerms(targetLanguage)` to avoid duplication
   - Common words (articles, prepositions, conjunctions): "the", "and", "of", "in"
   - Generic UI terms: "OK", "Cancel", "Save", "Close"
   - Very short texts (< 3 characters) unless they're important abbreviations
   - Full sentences or long descriptions (> 100 characters)
   - Placeholder-heavy texts (more placeholders than words)
   - Date/number format strings

   **Important**: Only include app-specific terminology not covered by the built-in BC glossary. The built-in glossary already contains standard Business Central terms and will be merged automatically during translation.

4. **Scoring and Ranking**

   Prioritize candidates in this order:

   1. Terms already in built-in BC glossary (highest value for consistency)
   2. Object names (tables, pages, codeunits)
   3. Multi-word phrases (more translation-critical than single words)
   4. Frequently occurring terms
   5. Capitalized technical terms

   Sort by priority and review top 50-100 candidates.

5. **Review and Select**

   Present top candidates to user with context:

   - Show term, frequency count, sample trans-unit types
   - Group by category (Object names, Fields, Concepts)
   - Suggest including terms with score > threshold
   - Allow user to add/remove terms interactively

6. **Generate Descriptions**

   For selected terms, generate descriptions using multiple sources:

   - **XLF Metadata**: Trans-unit type information, context from `note` elements, object hierarchy
   - **AL Source Code**: Object definitions, ToolTip/Caption properties, XML documentation comments
   - **BC Knowledge Base**: Standard BC terminology, built-in glossary descriptions

   **Description Format**: `[Purpose/Usage]. [Differentiation if needed].`
   Example: `Represents a company bank ledger; used for payments, reconciliation, cash flow. Keep abbreviation; singular header even in lists.`
   Keep concise (50-150 characters), focus on when/how the term is used in BC context.

7. **Validate**
   - Verify header row has all required columns
   - Check tab separation (not spaces or commas)
   - Ensure UTF-8 encoding
   - Verify en-US column is first

#### Quality Checks

- [ ] Header row present with column names
- [ ] `en-US` is first column
- [ ] `Description` is last column (if present - recommended)
- [ ] All language codes are valid locale identifiers
- [ ] No duplicate en-US terms
- [ ] File uses tab separators (not spaces or commas)

### 2. Add Language to Existing Glossary

**When to use**: Expanding an existing glossary to support additional languages.

#### Workflow

1. **Read Existing Glossary**

   - Open the glossary.tsv file
   - Parse header to identify existing columns
   - Verify file structure is valid

2. **Validate New Language**

   - Get language code from user (e.g., `fi-FI`, `it-IT`)
   - Check if language already exists in glossary
   - Validate locale code format (2-letter language + 2-letter country)

3. **Check for XLF Files**

   - Look for existing XLF files in the Translations folder for the new language
   - **If no XLF file exists for the target language**:
     - Offer to create new language XLF file using `createLanguageXlf`
     - Explain: "To populate the glossary with app-specific terms, you'll need a translation file. Would you like me to create an XLF file for [language code]?"
     - If user accepts: Create XLF file first, then proceed with adding language to glossary
     - If user declines: Proceed with empty glossary column (can be populated manually later)

4. **Determine Column Position**

   - Language columns must be after `en-US`
   - If `Description` column exists, language columns go before it
   - Recommend alphabetical order by language code for consistency
   - Identify insertion point

5. **Add Column**

   - Insert new column in header row
   - Add empty cells in all data rows
   - Maintain tab separation

6. **Optional: Populate Terms**

   - Offer to translate existing terms
   - Can use translation service or manual entry
   - Can extract terms from newly created XLF file (if created in step 3)
   - Can leave empty for later population

7. **Validate**
   - Verify all rows have correct column count
   - Check tab alignment
   - Ensure no data corruption in existing columns

#### Quality Checks

- [ ] New language code is valid and not duplicate
- [ ] Column count consistent across all rows
- [ ] Existing data unchanged
- [ ] Tab separators maintained
- [ ] File encoding preserved (UTF-8)

### 3. Review Glossary

**When to use**: Quality assurance, consistency checks, identifying gaps.

#### Review Types

##### A. Structural Review

Check file integrity and format:

- **Column consistency**: All rows have same number of columns
- **Separator consistency**: Only tabs used (no spaces/commas in separators)
- **Header validity**: Required columns present (`en-US`, `Description`)
- **Language codes**: All valid locale identifiers
- **Encoding**: UTF-8 without BOM
- **Line endings**: Consistent throughout file

##### B. Data Quality Review

Check content quality:

- **Duplicate terms**: No duplicate en-US entries
- **Empty required fields**: No empty en-US or Description cells
- **Translation completeness**: Percentage of filled cells per language
- **Description quality**: Descriptions provide sufficient context
- **Consistency**: Similar terms use consistent patterns

##### C. Terminology Review

Check translation consistency:

- **Capitalization**: Consistent across languages
- **Punctuation**: Appropriate for each language
- **Term length**: Reasonable (not truncated or overly long)
- **Context alignment**: Translations match description intent
- **Business Central alignment**: Terms align with BC standard terminology

#### Review Workflow

1. **Parse File**

   - Read and parse entire glossary
   - Build term index for duplicate detection
   - Count translations per language

2. **Run Checks**

   - Execute all relevant review types based on user request
   - Collect issues by severity (error, warning, info)

3. **Report Findings**

   - Summarize statistics (total terms, translation coverage per language)
   - List errors that must be fixed
   - List warnings that should be reviewed
   - Suggest improvements

4. **Propose Fixes**
   - Offer to fix structural issues automatically
   - Suggest corrections for data issues
   - Provide guidance for terminology improvements

#### Quality Metrics

Report these metrics for each language:

- **Coverage**: Percentage of terms translated
- **Empty cells**: Count of missing translations
- **Consistency score**: Based on pattern matching
- **Description completeness**: Terms with descriptions vs. without

### 4. Validate Glossary Structure

**When to use**: Before using glossary in translation workflow, after manual edits.

#### Validation Checks

1. **File Format**

   - Verify file exists and is readable
   - Check UTF-8 encoding
   - Verify tab-separated (not space or comma)

2. **Header Row**

   - First column is `en-US`
   - Last column is `Description` (if present - optional but recommended)
   - All other columns are valid language codes
   - No duplicate column names

3. **Data Integrity**

   - All rows have same column count as header
   - No duplicate en-US terms
   - No empty en-US cells
   - No empty Description cells (if Description column exists)

4. **Content Validation**
   - Descriptions provide context (minimum length ~20 characters) if Description column exists
   - Translations don't contain tab characters
   - No HTML/XML tags in terms (unless intentional)
   - Special characters properly escaped

#### Validation Workflow

1. **Run All Checks**

   - Execute validation in order of severity
   - Stop at critical errors (file not readable, wrong format)
   - Collect all warnings and info messages

2. **Report Results**

   - **PASS**: File is valid and ready for use
   - **FAIL**: Critical errors prevent usage
   - **WARNING**: Issues that should be addressed but don't prevent usage

3. **Provide Fix Options**
   - Offer automatic fixes for common issues
   - Provide guidance for manual corrections
   - Re-validate after fixes applied

## Integration with Translation Workflow

### Glossary Loading

When translating XLF files, glossary terms are loaded automatically:

1. **Local glossary**: Read from project's glossary.tsv file
2. **Extension glossary**: Read from NAB AL Tools extension resources
3. **Merge strategy**: Local glossary takes precedence over extension glossary

### Glossary Application

During translation:

1. **Exact match**: Look up en-US term in glossary
2. **Longest match first**: When multiple terms overlap, apply longest match
3. **Case sensitivity**: Prefer case-sensitive match, fall back to case-insensitive
4. **Preserve context**: Maintain term boundaries (don't match partial words)

### Term Priority

When glossary terms overlap:

1. **Multi-word phrases** have priority over single words
   - Example: "Customer Ledger Entry" before "Customer"
2. **Exact case match** before case-insensitive match
3. **Local glossary terms** before extension glossary terms

## Best Practices

### Glossary Content

1. **Focus on domain terms**: Technical BC concepts, not common words
2. **Provide context**: Descriptions should explain usage and differentiate similar terms
3. **Keep terms atomic**: One concept per line (don't combine multiple concepts)
4. **Use standard BC terminology**: Align with Microsoft's official translations when available

### Glossary Maintenance

1. **Version control**: Commit glossary.tsv to source control
2. **Review changes**: Carefully review glossary updates in PRs
3. **Document additions**: Note why new terms were added
4. **Periodic reviews**: Quarterly review for consistency and coverage

### Translation Guidelines

1. **Consistency**: Always use glossary terms exactly as specified
2. **Context awareness**: Consider Description when translating
3. **Completeness**: Aim for 100% translation coverage for active languages
4. **Quality over speed**: Ensure accuracy before adding terms

## Common Issues and Solutions

- **Duplicate en-US terms**: Review context of each duplicate — merge if same concept, differentiate with added context if different
- **Inconsistent tab separation**: Use a proper TSV editor; ensure no tabs within cell content; verify column count per row matches header
- **Missing descriptions**: Add usage context for each term (minimum: module name and term type; ideal: usage context and differentiation)
- **Incomplete language coverage**: Prioritize terms by frequency; use translation tools for initial translations, then review and refine
- **Encoding problems**: Ensure file is saved as UTF-8 (without BOM); check editor encoding settings; re-save with correct encoding if special characters appear corrupted

## Tools and Utilities

- **getGlossaryTerms** (Language Model Tool) — fetches glossary terms for a specific language, returns filtered subset based on target language, used automatically during XLF translation

---

**Note**: This instructions file is referenced by the NAB-XLF-Translator agent through the `manageGlossary.prompt.md` prompt file. All glossary operations should follow these guidelines to ensure consistency and quality.
