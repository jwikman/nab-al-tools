# Business Central Terminology Analysis Instructions

## Objective

**CRITICAL: Analyze EVERY SINGLE WORD/TERM in the provided text files** to extract Business Central-specific terminology that could cause translation challenges, and add qualified terms to a glossary file.

**MANDATORY REQUIREMENT: You MUST examine each and every line in the provided source file(s). Do not skip any terms. Process the entire file from beginning to end.**

## Input Files

- Source file(s) containing Business Central field names or terminology
- Target glossary file in TSV format (one term per line under "English" column)

## Qualification Criteria

### INCLUDE these types of terms:

1. **Core Business Central terminology** that translators need to understand (e.g., "G/L", "VAT", "BOM")
2. **Unique BC abbreviations** that don't exist in standard business vocabulary (e.g., "Codeunit", "Factbox")
3. **BC-specific document types** (e.g., "Posted Assembly Header", "Phys. Invt.")
4. **Key BC functional areas** (e.g., "Cash Flow", "Intercompany", "Cost Accounting")
5. **Technical BC concepts** that are domain-specific (e.g., "Assemble-to-Order", "Dimension Set")

### EXCLUDE these types of terms:

1. **Generic words** like "Date", "Amount", "Name", "Address", "Phone", "Email", "Setup", "Buffer"
2. **Common UI elements** like "Page", "Field", "Button", "Dialog", "Template", "Header", "Line"
3. **Day names** (Monday, Tuesday, etc.)
4. **\[BC\] prefixed terms** - these are odd and should be skipped
5. **Very common business terms** that are not BC-specific (e.g., "Customer", "Invoice", "Purchase", "Sales" by themselves)
6. **Programming/database terms** like "BLOB", "GUID", "System ID", "Buffer", "Entity" unless part of a BC-specific compound
7. **Repetitive variations** - if you have "Purchase Header", don't also include "Purchase Line", "Purchase Comment Line", etc. Choose the most representative term
8. **Generic combinations** - avoid terms like "Comment Line", "Archive", "Buffer", "Setup" unless they're part of a uniquely BC concept

### CONSOLIDATION RULES:

**CRITICAL: Aim for ~500 total entries across all source files (tables, fields, pages). Be highly selective.**

1. **Group similar terms** - Instead of including both "G/L Account" and "G/L Budget Entry", include only "G/L Account" as the core concept
2. **Avoid redundant variations** - Don't include both "Item Ledger Entry" and "Item Journal Line" - choose the most fundamental one
3. **Focus on base concepts** - Include "Dimension" rather than "Dimension Buffer", "Dimension Translation", "Dimension Correction", etc.
4. **Prioritize unique BC terminology** - Terms that would be completely foreign to non-BC translators take priority
5. **One representative per concept group** - For document types, include "Purchase Order" but not "Purchase Header", "Purchase Line", "Purchase Comment Line"
6. **Skip obvious variants** - If including "Ledger Entry", don't also include "Ledger Entry Buffer", "Detailed Ledger Entry", etc.

## Processing Rules

### Term Handling:

- **Case-insensitive deduplication**: If both "Customer No." and "customer no." exist, include only one
- **Compound terms**: Process as complete terms (e.g., "Purchase Order No." stays as one term)
- **Exact matching**: Only use terms that exist exactly in the provided source files
- **One term per line**: Add each qualified term on a separate line in the glossary

### Workflow:

1. **Read through EVERY SINGLE TERM in the provided source file(s) - NO EXCEPTIONS**

   - Start from the first line and continue to the last line
   - Do not skip any terms, regardless of how generic they might seem at first glance
   - Process the complete file systematically

2. **CONSOLIDATION PASS** - After identifying qualifying terms, perform deduplication:
   - Group related terms (e.g., "Purchase Header", "Purchase Line", "Purchase Comment")
   - Select only the most representative term from each group
   - Aim for ~500 total unique terms across all source files
   - Prioritize core BC concepts over variations
   - **IMPORTANT: Use multiple read_file calls if the file is large - read in chunks (e.g., 1000-2000 lines at a time) to ensure you process the entire file**
   - **Track your progress: State which lines you've processed (e.g., "Processed lines 1-2000, continuing with lines 2001-4000")**
3. For each term, evaluate against inclusion/exclusion criteria
4. Check if term already exists in glossary (case-insensitive)
5. If qualified and not duplicate, add to glossary file
6. Maintain alphabetical sorting if possible
7. **FINAL VERIFICATION: Before concluding, confirm you have processed from line 1 to the final line of the source file**

**REMINDER: The analysis must be COMPREHENSIVE and cover ALL terms in the source file(s). Partial analysis is not acceptable.**

## Preventing Incomplete Analysis

**CRITICAL SAFEGUARDS:**

- **Check file length first**: Use read_file to determine total number of lines in the source file
- **Process in manageable chunks**: If file has >2000 lines, process in chunks of 1000-2000 lines
- **Document progress**: After each chunk, explicitly state "Processed lines X-Y, found Z qualifying terms"
- **Continue until complete**: Keep processing chunks until you reach the final line number
- **Verify completion**: State "Analysis complete: processed all X lines from source file"

## Quality Assurance

- **Verify existence**: Every term added must exist exactly in the source file
- **No assumptions**: Do not add terms that seem logical but don't exist in source
- **Translation focus**: Ask "Would this term cause translation challenges or require specific BC knowledge?"

## Output Format

Add qualified terms to the existing glossary.tsv file under the "English" column, one term per line.

## Examples of Good Candidates:

- "G/L Account" (BC-specific, abbreviation)
- "Assembly BOM" (BC-specific compound)
- "Item Tracking" (BC-specific concept)
- "Purchase Order" (BC document type)
- "VAT Posting Group" (BC-specific setup)

## Examples to Exclude:

- "Amount" (too generic)
- "Monday" (day name)
- "Address" (common field)
- "\[BC\] Vendor No." (has \[BC\] prefix)
- "Page" (UI element)
