# Generate Business Central Glossary Instructions

## CRITICAL REQUIREMENTS

1. **READ THE ENTIRE JSON FILE DIRECTLY** - Do not create scripts, samples, or use any programming approach
2. **FOCUS ON SINGLE WORDS AND SHORT PHRASES ONLY** - Do not include complete sentences or long descriptions

## Overview

Create a comprehensive glossary of Microsoft Business Central terms and phrases by analyzing translation map JSON files. The glossary should capture domain-specific terminology and non-standard translations that are unique to Business Central. **This glossary will be used by GitHub Copilot as a reference when performing translations in other Business Central applications.**

## Input Files

- **Translation map JSON files** (approximately 8 MB each) - Primary source for term identification
- Format: `{"English text": ["Translation 1", "Translation 2", ...]}`
- Example file: `sv-se.json` for Swedish translations
- **XLIFF translation files** (e.g., `Base Application.sv-SE.xlf`, approximately 80 MB) - Secondary source for context analysis
- Contains same translations with additional metadata including developer notes indicating where translations are used in the system
- Use JSON for efficient term discovery, then query XLIFF for context determination

## Task Requirements

### 1. Analysis Process

**Phase 1: Term Identification (JSON File)**
**IMPORTANT: You must read and analyze the ENTIRE JSON translation file directly. Do not create scripts or sample the data.**

Read through the complete JSON translation file to identify:

**Target: Single Words and Short Phrases Only (NOT complete sentences)**

- Business terminology: "Purchase Order", "Sales Invoice", "Customer"
- Technical terms: "Posting Date", "Document No.", "Line No."
- Status values: "Pending", "Approved", "Released"
- UI elements: "Cue", "FactBox", "Role Center"
- Business processes: "Assembly", "Warehouse", "Approval"
- Field names: "Amount", "Quantity", "Unit Price"

**EXCLUDE: Complete sentences, long descriptions, and full error messages**

- ❌ "Specifies the number of approved incoming documents in the company"
- ❌ "Failed to determine if an External Accountant license is available"
- ✅ "External Accountant", "Incoming Documents", "License"

- Use JSON for efficient term discovery, then query XLIFF to confirm where a term is used in the system.

**Non-Standard Translations:**

- Technical terms that are translated unusually for the target language
- Terms where multiple translations exist with significant meaning differences
- Business Central specific abbreviations or shortened forms
- Compound terms that might be confusing without context

### 2. Selection Criteria

Prioritize terms that are:

- **Single words or short phrases (maximum 5-6 words)**
- Business Central domain-specific terminology
- Technical field names and UI labels
- Status values and workflow states
- Could cause confusion if translated incorrectly
- Have specific Business Central meaning different from general usage

**DO NOT include:**

- Complete sentences or long descriptions
- Full error messages or help text
- Tooltips or explanatory text
- Generic words that aren't Business Central specific

### 3. Output Format

Create a TSV (Tab-Separated Values) file named `glossary.tsv` with these columns:

```
English	[Target Language]	Description
```

**Column Details:**

- **English**: The source English text (first column)
- **[Target Language]**: The most commonly used translation from the JSON file (if multiple translations exist, select the most appropriate/standard one)
- **Description**: A brief explanation of the term's meaning within Business Central (concise, one-line)

**Example entries:**

```
English	Swedish	Description
Assembly Order	Monteringsorder	Production order to assemble components into finished items
Purchase Invoice	Inköpsfaktura	Invoice received from a vendor for goods or services
Cue	Stack-ikon	UI indicator showing counts or statuses on role centers
Document No.	Dokumentnr	Unique identifier for business documents
User ID Filter	Användar-ID-filter	Filter to restrict data by user ID
Status	Status	General indicator of record state
```

### 4. Quality Guidelines

- Maximum 1000 entries to keep the glossary manageable
- Focus on the most important and frequently used terms
- Ensure descriptions are clear and Business Central specific
- Include context when the same English term has different meanings in different modules
- Prioritize terms that would benefit translators and localizers
- **For Copilot usage**: Include sufficient context in descriptions to help automated translation decisions

### 5. Processing Instructions

**CRITICAL: Read the entire JSON file directly - do not create scripts or use sampling**

1. **Phase 1 - Direct File Analysis**: Load and parse the complete JSON translation file directly and identify candidate terms (single words or short phrases)
2. **Phase 2 - XLIFF Confirmation (optional)**: For each identified term, you may search the XLIFF file to confirm where the term is used (locations in `<note from="Developer">`).
3. Apply selection criteria to identify the most relevant Business Central terms (single words/short phrases only)
4. Rank terms by importance and Business Central specificity
5. Generate concise one-line descriptions based on JSON context and, if needed, XLIFF confirmation
6. Format output as TSV with proper escaping for special characters
7. Save as `glossary.tsv` in the same directory as the input files

### 6. Special Considerations

- Handle multiple translations by selecting the most commonly used or standard translation from JSON
- Use XLIFF search efficiently - consider indexing or streaming approach due to 80MB file size
- Escape tabs and newlines in text content
- Consider abbreviations and their full forms as separate entries if both are important
- Include both singular and plural forms if they translate differently
- Be aware of regional differences in business terminology

## Expected Output

A well-structured TSV file containing the most important Business Central terminology for the target language, suitable for use by translators, localizers, and Business Central consultants.
