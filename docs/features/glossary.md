# Glossary Management

Comprehensive guide to using and managing translation glossaries in NAB AL Tools.

## Overview

Glossaries ensure consistent terminology across translations by providing standard translations for common terms. NAB AL Tools supports both a built-in Business Central glossary and project-specific local glossaries.

## Types of Glossaries

### Built-in Business Central Glossary

NAB AL Tools includes a comprehensive glossary of standard Business Central terms with translations for multiple languages.

**Features:**
- Professional Microsoft-quality translations
- Standard BC terminology
- Multiple language support
- Regularly updated
- No setup required

**Coverage:**
- Core BC objects (Customer, Item, Vendor, etc.)
- Common UI terms
- Standard actions and operations
- Field types and properties

**Languages supported:**
- Danish (da-DK)
- Swedish (sv-SE)
- Norwegian (nb-NO)
- German (de-DE)
- French (fr-FR)
- Spanish (es-ES)
- And more...

### Local Project Glossary

Project-specific glossary files allow you to define custom terminology that overrides the built-in glossary.

**Features:**
- Project-specific terms
- Custom translations
- Team-controlled
- Version-controlled with your code
- Takes precedence over built-in glossary

**Use cases:**
- Industry-specific terminology
- Company-specific terms
- Product-specific vocabulary
- Regional language variants

## Creating a Local Glossary

### Manual Creation

Create a glossary file manually in your project:

**Location:** `Translations/glossary.tsv`

**Format:** Tab-Separated Values (TSV)

**Structure:**
```tsv
en-US	da-DK	sv-SE	Description
Customer	Kunde	Kund	Business Central term
Item	Vare	Artikel	Business Central term
Posting	Bogføring	Bokföring	Action term
Custom Widget	Brugerdefineret widget	Anpassad widget	Our product feature
```

**Requirements:**
1. **First line:** Header with ISO language codes
2. **First column:** Source language (typically en-US)
3. **Last column:** Description (optional, can be omitted)
4. **Middle columns:** Target languages
5. **Separator:** Tab character (not spaces)

**Minimal example (without descriptions):**
```tsv
en-US	da-DK	sv-SE
Customer	Kunde	Kund
Item	Vare	Artikel
```

### Using AI Assistant

Create glossaries with the NAB-XLF-Translator agent:

**Command:** `/manageGlossary`

**What it does:**
1. Identifies AL application and Translations folder
2. Creates or updates `glossary.tsv`
3. Ensures correct TSV format
4. Validates language codes
5. Provides guidance on structure

**Usage examples:**

**Create new glossary:**
```
/manageGlossary
```

**Add specific terms:**
```
/manageGlossary add Danish translation for "Customer Ledger Entry"
```

**Add new language column:**
```
/manageGlossary add Norwegian to glossary
```

**Review existing glossary:**
```
/manageGlossary review the glossary file
```

**Agent capabilities:**
- Understands TSV format requirements
- Validates language codes
- Maintains existing structure
- Adds new terms correctly
- Preserves descriptions

## Glossary File Format

### TSV Format Requirements

**File characteristics:**
- Plain text file
- Tab-separated values
- UTF-8 encoding
- `.tsv` extension

**Column structure:**
```
Column 1: en-US (source language)
Column 2-N: Target languages (e.g., da-DK, sv-SE, nb-NO)
Column N+1: Description (optional)
```

**Header row:**
```tsv
en-US	da-DK	sv-SE	nb-NO	Description
```

### Language Codes

Use ISO 639-1 language codes with ISO 3166-1 country codes:

**Format:** `language-COUNTRY`

**Common codes:**
- `en-US` - English (United States)
- `da-DK` - Danish (Denmark)
- `sv-SE` - Swedish (Sweden)
- `nb-NO` - Norwegian Bokmål (Norway)
- `de-DE` - German (Germany)
- `fr-FR` - French (France)
- `es-ES` - Spanish (Spain)
- `nl-NL` - Dutch (Netherlands)
- `fi-FI` - Finnish (Finland)
- `it-IT` - Italian (Italy)

**Case sensitivity:** Codes are case-insensitive in NAB AL Tools

### Description Column

The description column provides context for translators:

**Purpose:**
- Explain term usage
- Clarify ambiguous terms
- Provide translation guidance
- Document source/origin

**Examples:**
```tsv
en-US	da-DK	Description
Post	Bogfør	Action: submit/finalize a document
Post	Stolpe	Physical object: vertical support
Customer	Kunde	Business Central standard term
```

**Best practices:**
- Keep descriptions concise
- Explain context when needed
- Note if term is BC-standard
- Clarify ambiguous terms

### Example Glossary

**Complete example:**
```tsv
en-US	da-DK	sv-SE	nb-NO	Description
Customer	Kunde	Kund	Kunde	BC core entity
Customer Ledger Entry	Kundepost	Kund reskontratransaktion	Kundepost	BC table
Item	Vare	Artikel	Vare	BC core entity
Posting	Bogføring	Bokföring	Bokføring	Action term
Posting Date	Bogføringsdato	Bokföringsdatum	Bokføringsdato	Field name
Quantity	Antal	Antal	Antall	Field name
Unit Price	Enhedspris	Enhetspris	Enhetspris	Field name
Sales Order	Salgsordre	Försäljningsorder	Ordre	Document type
Purchase Invoice	Købsfaktura	Inköpsfaktura	Kjøpsfaktura	Document type
General Ledger	Finans	Redovisning	Finans	BC area
Warehouse	Lager	Distributionslager	Lager	BC area
Setup	Opsætning	Inställningar	Oppsett	Configuration
Specifies	Angiver	Anger	Angir	Tooltip standard start
```

## Using Glossaries

### In Manual Translation

When translating manually, reference glossaries:

**Process:**
1. Identify term in source text
2. Check glossary for standard translation
3. Use glossary term in translation
4. Maintain consistency across all translations

**Benefits:**
- Consistent terminology
- Faster translation (no guessing)
- Professional quality
- Team alignment

### In AI-Assisted Translation

Glossaries automatically enhance AI translation workflows:

**NAB-XLF-Translator agent:**
1. Loads built-in BC glossary
2. Loads local project glossary (if exists)
3. Merges glossaries (local takes precedence)
4. Applies terms during translation
5. Ensures consistency

**Language Model Tools:**
- `getGlossaryTerms` tool provides glossary access
- AI workflows can query glossary
- Automatic term application in translations

**Example workflow:**
```
User: /translateXlfFiles Danish
Agent: 
  1. Loads glossaries
  2. Gets untranslated texts
  3. Applies glossary terms
  4. Translates remaining text
  5. Validates consistency
  6. Saves translations
```

### Precedence Rules

When term exists in multiple sources:

**Priority order:**
1. **Local project glossary** (highest)
2. Built-in BC glossary
3. Translation matching (if enabled)
4. AI translation

**Example:**
```
Built-in: Customer → Kunde
Local: Customer → Debitor

Result: Uses "Debitor" (local takes precedence)
```

**Use case:** Override BC standard when company prefers different term.

## Managing Glossary Terms

### Adding New Terms

**Manual:**
1. Open `Translations/glossary.tsv`
2. Add new row with term
3. Provide translations for all languages
4. Add description (recommended)
5. Save file

**Example:**
```tsv
en-US	da-DK	sv-SE	Description
New Term	Ny term	Ny term	Description of new term
```

**AI-assisted:**
```
/manageGlossary add term "Configuration Template" with Danish "Konfigurationsskabelon"
```

### Updating Existing Terms

**Manual:**
1. Find term in `glossary.tsv`
2. Update translation
3. Update description if needed
4. Save file

**AI-assisted:**
```
/manageGlossary update "Customer" translation in Danish
```

### Adding Language Columns

When adding support for new language:

**Manual:**
1. Add language code to header row
2. Add column in each data row
3. Provide translations
4. Save file

**Before:**
```tsv
en-US	da-DK	Description
Customer	Kunde	BC term
```

**After:**
```tsv
en-US	da-DK	sv-SE	Description
Customer	Kunde	Kund	BC term
```

**AI-assisted:**
```
/manageGlossary add Swedish column to glossary
```

### Removing Terms

**Manual:**
1. Open `glossary.tsv`
2. Delete entire row
3. Save file

**When to remove:**
- Term no longer used
- Duplicate entry
- Incorrect term

### Reviewing and Validating

**Check glossary quality:**
1. Consistent terminology
2. All columns filled
3. Descriptions provided
4. No duplicates
5. Correct TSV format

**Validation tools:**
- Use `/manageGlossary review` command
- Check with text editor that shows tabs
- Verify in spreadsheet application

**Common issues:**
- Spaces instead of tabs
- Missing translations
- Duplicate terms
- Inconsistent descriptions

## Best Practices

### Building Your Glossary

**Start small:**
1. Add most common terms first
2. Build incrementally
3. Add as you encounter repeated terms
4. Don't try to be exhaustive initially

**Focus on consistency:**
- Terms used frequently
- Terms with multiple possible translations
- BC-specific terminology
- Industry jargon

**Include context:**
- Add descriptions for ambiguous terms
- Note if term is BC-standard
- Explain usage if helpful

### Maintaining Quality

**Regular review:**
- Check for duplicates
- Verify translations
- Update descriptions
- Add new terms as needed

**Team collaboration:**
- Discuss terms with translators
- Get native speaker feedback
- Document decisions
- Keep glossary up to date

**Version control:**
- Commit glossary with code
- Track changes
- Document major updates
- Review in pull requests

### Term Selection

**Include in glossary:**
- ✅ BC standard terms
- ✅ Frequently used terms
- ✅ Terms with ambiguous translations
- ✅ Company-specific terminology
- ✅ Industry jargon

**Don't include:**
- ❌ One-time terms
- ❌ Obvious translations
- ❌ Complete sentences
- ❌ Dynamic content

**Examples of good glossary terms:**
- Business objects: Customer, Item, Vendor
- Actions: Post, Ship, Invoice
- Document types: Sales Order, Purchase Invoice
- Field names: Quantity, Unit Price, Posting Date
- BC areas: General Ledger, Warehouse, CRM

## Glossary in Different Workflows

### Manual Translation Workflow

**Process:**
1. Receive text to translate
2. Check glossary for terms
3. Apply glossary translations
4. Translate remaining text
5. Verify consistency

**Tools:**
- Open `glossary.tsv` in separate editor
- Search for terms (Ctrl+F)
- Reference while translating

### AI Translation Workflow

**Process:**
1. Agent loads glossaries automatically
2. Applies glossary terms during translation
3. Translates non-glossary text
4. Validates consistency
5. Saves translations

**Benefits:**
- Automatic term application
- Guaranteed consistency
- Faster processing
- Reduced errors

### Review Workflow

**Process:**
1. Check translations against glossary
2. Verify glossary terms used correctly
3. Identify inconsistencies
4. Update translations if needed
5. Update glossary if better term found

**Checklist:**
- [ ] Glossary terms used consistently
- [ ] No alternative translations for glossary terms
- [ ] All occurrences use same translation
- [ ] New terms added to glossary if appropriate

## getGlossaryTerms Tool

### Purpose

Language Model Tool and MCP server endpoint for accessing glossaries programmatically.

### Parameters

```typescript
{
  targetLanguageCode: string;      // Required: e.g., "da-DK"
  sourceLanguageCode?: string;     // Optional: default "en-US"
  localGlossaryPath?: string;      // Optional: path to local glossary
}
```

### Return Format

```typescript
{
  entries: [
    {
      source: string;      // Source term
      target: string;      // Target translation
      description: string; // Description (may be empty)
    }
  ]
}
```

### Example Usage

**In AI workflow:**
```
AI: Using getGlossaryTerms for da-DK...
Result: 150 glossary terms loaded
Terms include: Customer→Kunde, Item→Vare, Posting→Bogføring...
```

**With local glossary:**
```typescript
getGlossaryTerms({
  targetLanguageCode: "da-DK",
  localGlossaryPath: "/workspace/Translations/glossary.tsv"
})
```

**Result:**
```json
{
  "entries": [
    {
      "source": "Customer",
      "target": "Debitor",
      "description": "Our preferred term"
    }
  ]
}
```

### Error Handling

**Missing language:**
```
Error: Target language 'xx-XX' not found in glossary
```

**Invalid file:**
```
Error: Local glossary file not found at path: /path/to/glossary.tsv
```

**Format error:**
```
Error: Expected TSV format with language codes in first row
```

## Troubleshooting

### Glossary not loading

**Symptom:** Terms not applied during translation

**Solutions:**
1. Verify file exists: `Translations/glossary.tsv`
2. Check file format (TSV, not CSV)
3. Verify header row has language codes
4. Check encoding is UTF-8
5. Ensure no spaces before/after terms

### Wrong translations used

**Symptom:** Unexpected translations in results

**Check:**
1. Verify local glossary has correct terms
2. Check built-in glossary not overriding (remember: local takes precedence)
3. Verify language codes match
4. Check for typos in terms

### Format errors

**Symptom:** Error reading glossary file

**Solutions:**
1. Use tabs, not spaces
2. Verify all rows have same column count
3. Check UTF-8 encoding
4. Remove empty rows
5. Ensure header row present

**Validation:**
Open in Excel or LibreOffice, verify:
- Columns align correctly
- No extra separators
- All cells filled

### Terms not recognized

**Symptom:** Glossary terms not matching in translations

**Causes:**
- Case mismatch (usually OK, tools are case-insensitive)
- Extra whitespace in term
- Different word form (plural vs singular)
- Punctuation differences

**Solutions:**
- Add variations of term to glossary
- Standardize term format
- Check exact text in source

## Language-Specific Considerations

### Danish (da-DK)

**Characteristics:**
- Compound words common
- Uses "å", "æ", "ø"
- Formal vs informal (BC uses informal)

**Glossary tips:**
- Include compound variants
- Note formal/informal choice
- Standard BC terms well-established

### Swedish (sv-SE)

**Characteristics:**
- Similar to Danish but different
- Uses "å", "ä", "ö"
- Different compound word formation

**Glossary tips:**
- Don't assume same as Danish
- Many BC terms differ from Danish
- Include Swedish-specific compounds

### Norwegian (nb-NO, nn-NO)

**Characteristics:**
- Two written standards: Bokmål (nb-NO) and Nynorsk (nn-NO)
- BC typically uses Bokmål
- Similar to Danish but distinct

**Glossary tips:**
- Specify which Norwegian standard
- Note differences from Danish
- BC terms may differ significantly

### German (de-DE)

**Characteristics:**
- Compound words very common
- Formal vs informal (BC uses formal)
- All nouns capitalized

**Glossary tips:**
- Include full compound forms
- Note capitalization requirements
- Standard SAP terminology often applies

## Integration with Translation Tools

### VS Code Extension

**Automatic integration:**
- Language Model Tools access glossaries
- AI workflows apply terms
- Manual reference available

**Manual usage:**
1. Open `Translations/glossary.tsv`
2. Keep open in editor
3. Reference during translation

### MCP Server

**Endpoint:** `getGlossaryTerms`

**Integration:**
- Claude Desktop
- GitHub Copilot Coding Agent
- Other MCP clients

**Usage:**
Same as Language Model Tool, programmatic access.

### External Translation Tools

**Export glossary:**
1. Open `glossary.tsv`
2. Save as CSV if tool requires
3. Import to translation tool

**Tools supporting glossary:**
- Crowdin
- MemoQ
- SDL Trados
- Many others

## Examples

### Basic Project Glossary

```tsv
en-US	da-DK	sv-SE	Description
Customer	Kunde	Kund	BC standard
Item	Vare	Artikel	BC standard
Posting	Bogføring	Bokföring	Action
Setup	Opsætning	Inställningar	Configuration
```

### Industry-Specific Glossary

```tsv
en-US	da-DK	Description
Widget Production	Widget-produktion	Our product line
Quality Inspection	Kvalitetskontrol	QA process
Batch Tracking	Batchsporing	Inventory feature
Compliance Report	Overensstemmelsesrapport	Regulatory requirement
```

### Multi-Language Glossary

```tsv
en-US	da-DK	sv-SE	nb-NO	de-DE	Description
Customer	Kunde	Kund	Kunde	Kunde	Core entity
Sales Order	Salgsordre	Försäljningsorder	Ordre	Verkaufsauftrag	Document
Warehouse	Lager	Distributionslager	Lager	Lager	BC module
```

## See Also

- [Translation Workflow Guide](../guides/translation-workflow.md)
- [Language Model Tools](language-model-tools.md)
- [XLIFF Tools](xliff-tools.md)
- [Translation Review Workflow](../guides/translation-review-workflow.md)
- [MCP Server Documentation](../../extension/MCP_SERVER.md)
