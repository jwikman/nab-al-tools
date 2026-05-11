# XLIFF Tools Reference

Complete reference for all XLIFF translation management features in NAB AL Tools.

## Overview

NAB AL Tools provides a complete suite of tools for managing XLIFF (XML Localization Interchange File Format) translations in Business Central AL applications. These tools streamline the translation workflow from code generation to final review.

## Understanding XLIFF Files

### File Structure

Business Central uses XLIFF 1.2 format with these key files:

**g.xlf file (Generated XLIFF)**
- Created by AL compiler during build
- Named `<AppName>.g.xlf`
- Contains all translatable texts from AL code
- Source of truth for translation updates
- Located in `Translations/` folder

**Language-specific XLF files**
- One per target language (e.g., `MyApp.da-DK.xlf`, `MyApp.sv-SE.xlf`)
- Contains translations for specific language
- Based on g.xlf structure
- Managed by translation workflow

### XLIFF Elements

```xml
<xliff version="1.2">
  <file source-language="en-US" target-language="da-DK" 
        original="MyApp" datatype="plaintext">
    <body>
      <group id="body">
        <trans-unit id="Table 123 - Field 456 - Property 789" 
                    translate="yes" maxwidth="50">
          <source>Customer Name</source>
          <target state="translated">Kundenavn</target>
          <note from="Developer" priority="1">
            The full name of the customer
          </note>
          <note from="Xliff Generator" priority="3">
            Table MyTable - Field CustomerName - Property Caption
          </note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>
```

**Key elements:**
- `<trans-unit>` - Individual translation unit
- `<source>` - Original text from AL code
- `<target>` - Translated text
- `id` - Unique identifier
- `state` - Translation state (if using target states)
- `translate` - Whether unit should be translated
- `maxwidth` - Character limit constraint
- `<note>` - Comments and context

## Core Commands

### NAB: Refresh XLF files from g.xlf

**Purpose:** Update all language XLF files from the g.xlf file

**When to use:**
- After building your AL application
- When AL code changes added/modified translatable texts
- To sync translations with latest code

**What it does:**
1. Reads g.xlf file
2. Updates all language XLF files in workspace
3. Adds new translation units
4. Marks modified source texts for review
5. Preserves existing valid translations
6. Applies translation matching (if enabled)
7. Sorts files to match g.xlf order
8. Removes units marked `translate="no"`

**Behavior modes:**

**NAB Tags mode** (`UseTargetStates: false`):
- New translations: `[NAB: NOT TRANSLATED]`
- Modified translations: `[NAB: REVIEW]`
- Same language copy: `[NAB: REVIEW]`
- Matched translations: `[NAB: SUGGESTION]` (unless auto-accept enabled)

**Target States mode** (`UseTargetStates: true`):
- New translations: `state="new"` or `state="needs-translation"`
- Modified translations: `state="needs-adaptation"` or `state="needs-review-translation"`
- Same language: `state="needs-review-translation"`
- Matched translations: State set per `SetExactMatchToState` setting

**Usage:**
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run **`NAB: Refresh XLF files from g.xlf`**
3. All XLF files updated automatically
4. Check output channel for summary

**Output example:**
```
Refreshing XLF files...
Found 3 language files: da-DK, sv-SE, nb-NO
- da-DK: 5 new, 2 modified, 148 unchanged
- sv-SE: 5 new, 2 modified, 150 unchanged
- nb-NO: 5 new, 2 modified, 145 unchanged
Refresh completed successfully
```

**Settings:**
- `NAB.UseTargetStates` - Enable target states mode
- `NAB.MatchTranslation` - Enable translation matching
- `NAB.AutoAcceptSuggestions` - Auto-accept first match (NAB tags only)
- `NAB.SetExactMatchToState` - State for matches (target states only)
- `NAB.ClearTargetWhenSourceHasChanged` - Clear target on source change
- `NAB.SkipTranslationPropertyForLanguage` - Skip specific properties
- `NAB.PreserveOriginalAttribute` - Match 'original' attribute
- `NAB.RemoveTranslationCommentsAfterUse` - Remove AL code comments
- `NAB.SearchReplaceBeforeSaveXliff` - Regex replace before save

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)
- [Target States vs NAB Tags](target-states-vs-nab-tags.md)

### NAB: Find next untranslated text

**Keyboard shortcut:** `Ctrl+Alt+U`

**Purpose:** Navigate to next translation needing attention

**When to use:**
- During translation workflow
- Reviewing translations
- Finding remaining untranslated texts

**What it does:**

**NAB Tags mode:**
- Searches for `[NAB: NOT TRANSLATED]`, `[NAB: REVIEW]`, `[NAB: SUGGESTION]`
- Selects tag and surrounding context
- Moves cursor to next occurrence

**Target States mode:**
- Searches for targets with states: `new`, `needs-translation`, `needs-adaptation`, `needs-review-translation`
- Also finds targets without state attribute
- Moves cursor to target element

**Usage:**
1. Open XLF file
2. Press `Ctrl+Alt+U` repeatedly
3. Translate or review each item
4. Continue until no more found

**Tips:**
- Use repeatedly to work through all translations
- Saves time versus manual searching
- Works across entire file

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Update g.xlf ⚠️ Experimental

**Purpose:** Update g.xlf file from AL source code without full compilation

**⚠️ Note:** This is an experimental feature. While it works well, it's not 100% identical to the AL compiler output. **The recommended approach is to build your application with F5 or Ctrl+Shift+B to ensure the g.xlf file is updated correctly.**

**When to use:**
- When you can't compile due to missing dependencies
- Quick translation updates during development
- When full build isn't feasible

**What it does:**
1. Scans AL files for translatable texts
2. Updates g.xlf with new/modified texts
3. Removes texts marked `Locked = true`
4. Places new units at end of file
5. Preserves existing units

**Limitations:**
- Uses text matching (not compiler)
- May miss complex cases
- New units not sorted (sort on next build)
- Requires properly formatted AL code

**Usage:**
1. Make changes to AL code
2. Run **`NAB: Update g.xlf`**
3. Run **`NAB: Refresh XLF files from g.xlf`** to update language files

**Best practices:**
- Use AL formatter before running
- Verify changes in g.xlf
- Follow with full build when possible
- Report any parsing issues

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Update all XLF files ⚠️ Experimental

**Purpose:** Convenience command combining g.xlf update and refresh

**⚠️ Note:** Uses the experimental g.xlf update feature. **The recommended approach is to build your application via the AL extension and then use `NAB: Refresh XLF files from g.xlf` to ensure the g.xlf file is updated correctly.**

**When to use:**
- When you can't build due to missing dependencies
- Quick update of all translation files during development
- When full build isn't feasible but you need both operations

**What it does:**
1. Runs **`NAB: Update g.xlf`**
2. Runs **`NAB: Refresh XLF files from g.xlf`**
3. All unsaved files saved first

**Usage:**
1. Run **`NAB: Update all XLF files`**
2. All translation files updated
3. Check for new untranslated texts

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Find untranslated texts

**Purpose:** Search workspace for translations needing attention

**When to use:**
- Verifying translation completion
- Finding specific translation issues
- Generating translation report

**What it does:**
- Uses VS Code "Find in Files" feature
- Searches based on translation mode

**NAB Tags mode:**
- Searches for: `[NAB: NOT TRANSLATED]`, `[NAB: REVIEW]`, `[NAB: SUGGESTION]`

**Target States mode:**
- Searches for state attributes requiring attention

**Usage:**
1. Run **`NAB: Find untranslated texts`**
2. Review search results panel
3. Navigate to specific translations
4. Address items found

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

## Navigation and Context Commands

### NAB: Find translated texts of current line

**Purpose:** Find translations of AL code line

**When to use:**
- Want to see all translations of current text
- Checking translation consistency
- Need to update translations after code change

**What it does:**
1. Identifies translatable text on current AL code line
2. Searches for translations in XLF files
3. Opens XLF or shows search results

**Behavior:**
- Single translation file: Opens file with translation selected
- Multiple files: Shows "Find in Files" results with all translations

**Usage:**
1. Position cursor on AL code line with translatable text
2. Run **`NAB: Find translated texts of current line`**
3. View or edit translations

**Example:**
```al
field("Customer Name"; CustomerName)
{
    Caption = 'Customer Name';  // Cursor here
}
```
Results:
```
MyApp.da-DK.xlf: <target>Kundenavn</target>
MyApp.sv-SE.xlf: <target>Kundnamn</target>
```

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Find source of current Translation Unit

**Keyboard shortcut:** `F12` (when in XLF file)

**Purpose:** Navigate from translation to AL source code

**When to use:**
- Need to see context of translation
- Want to understand usage
- Verifying translation appropriateness

**What it does:**
1. Reads trans-unit ID
2. Parses object and property information
3. Locates AL source file
4. Opens file at relevant location

**Usage:**
1. Position cursor anywhere in trans-unit in XLF file
2. Press `F12` or run **`NAB: Find source of current Translation Unit`**
3. AL source file opens at relevant location

**Example:**
```xml
<trans-unit id="Table 50100 - Field 1 - Property 2879900210">
  <source>Customer Name</source>
  <!-- Cursor here, press F12 -->
</trans-unit>
```
Opens AL file with the field definition.

**See also:**
- [Translation Review Workflow](../guides/translation-review-workflow.md)

## Translation Matching Commands

### NAB: Match Translations From Base Application

**Purpose:** Match translations from Microsoft's BaseApp

**When to use:**
- Starting translations for new language
- Want BC-standard translations
- Need suggestions for common BC terms

**What it does:**
1. Downloads BaseApp translations (if not cached)
2. Matches source texts with BaseApp translations
3. Suggests BC-standard translations

**Behavior:**

**NAB Tags mode:**
- Adds `[NAB: SUGGESTION]` prefix to matched translations

**Target States mode:**
- Sets first match as target
- Sets state per `SetExactMatchToState`
- Sets state-qualifier to `exact-match`

**Usage:**
1. (Optional) Run **`NAB: Refresh XLF files from g.xlf`**
2. Run **`NAB: Match Translations From Base Application`**
3. Select language files to process
4. Review suggestions with `Ctrl+Alt+U`

**Benefits:**
- Leverages Microsoft's professional translations
- Ensures BC terminology consistency
- Saves significant translation time
- High quality for standard BC objects

**Settings:**
- `NAB.MatchTranslation` - Must be enabled
- `NAB.AutoAcceptSuggestions` - Auto-accept (NAB tags)
- `NAB.SetExactMatchToState` - State for matches (target states)

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Match translations from external XLF file

**Purpose:** Match translations from another XLF file

**When to use:**
- Reusing translations from similar project
- Importing translations from external source
- Leveraging previous translation work

**What it does:**
1. Select external XLF file for matching
2. Matches source texts between files
3. Suggests translations from external file
4. Only updates files with same target language

**Usage:**
1. Run **`NAB: Match translations from external XLF file`**
2. Select external XLF file
3. Matching applied to compatible language files
4. Review suggestions

**Use cases:**
- Previous version of same app
- Similar app with related translations
- External translation memory
- Partner-provided translations

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

## File Management Commands

### NAB: Create translation XLF for new language

**Purpose:** Create new language translation file

**When to use:**
- Adding support for new language
- Expanding language coverage
- Starting translations from scratch

**What it does:**
1. Prompts for target language code
2. Creates new XLF file: `<AppName>.<language-code>.xlf`
3. Copies structure from g.xlf
4. Optionally matches BaseApp translations
5. Saves to Translations folder

**Usage:**
1. Run **`NAB: Create translation XLF for new language`**
2. Enter language code (e.g., `da-DK`, `sv-SE`, `nb-NO`)
3. Choose whether to match BaseApp
4. File created and opened

**Language code format:**
- Use standard ISO codes
- Format: `language-COUNTRY` (e.g., `en-US`, `da-DK`)
- No validation performed (your responsibility)

**Example workflow:**
```
1. Run command
2. Enter: "da-DK"
3. Select: "Yes" to BaseApp matching
4. Result: MyApp.da-DK.xlf created with BC translations pre-filled
```

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Create XLF with selected Source Language

**Purpose:** Create XLF using non-English source language

**When to use:**
- Translating between two non-English languages
- Source language not available in g.xlf
- Translator knows source language better than English

**What it does:**
1. Select source language XLF (must be translated)
2. Select target language XLF
3. Creates new intermediate XLF file
4. Source language texts become `<source>` elements
5. Target language texts become `<target>` elements
6. Preserves target states

**Usage:**
1. Ensure source language fully translated
2. Run **`NAB: Create XLF with selected Source Language`**
3. Select source XLF (e.g., Danish)
4. Select target XLF (e.g., Norwegian)
5. New file created: `<AppName>.<source>-<target>.xlf`
6. Translate in new file
7. Use **`NAB: Import Translations by Id`** to import back

**Example workflow:**
```
1. Have completed Danish (da-DK) translations
2. Want to translate to Norwegian (nb-NO)
3. Create intermediate file with Danish as source
4. Translator translates Danish → Norwegian
5. Import Norwegian translations back to main nb-NO file
```

**Settings:**
- `NAB.SkipTranslationPropertyForLanguage` - Respected during creation

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Import Translations by Id

**Purpose:** Import translations from another XLF file by ID

**When to use:**
- After translating with non-English source
- Importing translations from external process
- Merging translations from multiple sources

**What it does:**
1. Select source XLF (contains translations to import)
2. Select target XLF (will receive translations)
3. Matches trans-units by `id` attribute
4. Updates targets where IDs match
5. Only updates if target differs

**Usage:**
1. Complete translations in intermediate file
2. Run **`NAB: Import Translations by Id`**
3. Select source file (your translated file)
4. Select target file (main language file)
5. Translations imported

**Use cases:**
- After using **`NAB: Create XLF with selected Source Language`**
- Importing externally translated file
- Merging partial translations

**Settings:**
- `NAB.ignoreMissingTransUnitsOnImport` - Ignore missing units
- `NAB.importTranslationWithDifferentSource` - Allow source mismatch

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Sort XLF files as g.xlf

**Purpose:** Reorder language files to match g.xlf

**When to use:**
- After manual edits scrambled order
- Want consistent file structure
- Preparing for comparison or diff

**What it does:**
1. Reads order from g.xlf
2. Reorders trans-units in language files
3. Maintains same structure across all files

**Usage:**
1. Run **`NAB: Sort XLF files as g.xlf`**
2. All language files sorted
3. File structure now matches g.xlf

**Benefits:**
- Easier file comparison
- Consistent structure
- Better diff results in version control

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

## Editing and Review Commands

### NAB: Edit Xliff Document

**Purpose:** Open XLIFF in specialized visual editor

**When to use:**
- Prefer visual interface over XML
- Batch reviewing translations
- Want progress tracking
- Easier checkbox-based workflow

**What it does:**
1. Opens XLF file in custom webview editor
2. Displays translations in table format
3. Provides filtering and sorting
4. Enables checkbox-based approval
5. Shows progress statistics

**Features:**

**Filtering:**
- Show untranslated only
- Show review items only
- Show by state (target states mode)
- Show state 'final'

**Approval:**
- Checkbox advances states
- Header shows next state action
- Batch approval supported

**Navigation:**
- Click to edit translation
- Visual progress tracking
- Statistics display

**Target States mode:**
- Checkbox transitions through states
- `translated` → `signed-off` → `final`
- Unchecking reverts to previous state

**Usage:**
1. Run **`NAB: Edit Xliff Document`**
2. Select XLF file
3. Use visual editor for translations
4. Save when complete

**See also:**
- [Translation Review Workflow](../guides/translation-review-workflow.md)

### NAB: Copy source to target

**Purpose:** Copy source text to target for current trans-unit

**When to use:**
- Source language same as target
- Placeholder for later translation
- Text is language-independent (code, numbers)

**What it does:**
1. Reads `<source>` element
2. Copies content to `<target>` element
3. Cursor must be in target element

**Usage:**
1. Position cursor in target element in XLF
2. Run **`NAB: Copy source to target`**
3. Source copied to target

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Copy all source to untranslated target

**Purpose:** Copy all sources to targets for untranslated units

**When to use:**
- Converting from C/AL with no English texts
- Creating baseline for gradual translation
- Need placeholder translations

**What it does:**
1. Finds all untranslated trans-units
2. Copies source to target for each
3. Optionally marks for review
4. Processes entire file

**Usage:**
1. Open XLF file
2. Run **`NAB: Copy all source to untranslated target`**
3. Choose whether to mark for review
4. All untranslated units filled

**Use case:**
Legacy C/AL conversion where original language wasn't English.

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

## Export and Import Commands

### NAB: Export Translations to .csv

**Purpose:** Export translations to CSV for external editing

**When to use:**
- Working with translators who prefer Excel/CSV
- Need backup of translations
- External translation tool requires CSV

**What it does:**
1. Exports XLF content to CSV format
2. Includes source, target, and metadata
3. Saves to specified location

**CSV format:**
```csv
ID,Source,Target,State,Notes
"Table 123 - Field 456","Customer Name","Kundenavn","translated","Caption"
```

**Usage:**
1. Open XLF file
2. Run **`NAB: Export Translations to .csv`**
3. Choose location and filename
4. CSV created

**See also:**
- [NAB: Import Translations from .csv](#nab-import-translations-from-csv)

### NAB: Export Translations to .csv (Select columns and filter)

**Purpose:** Export with custom columns and filtering

**When to use:**
- Need specific columns only
- Want to filter export content
- Creating custom translation report

**What it does:**
1. Prompts for columns to include
2. Prompts for filters
3. Exports matching criteria to CSV

**Usage:**
1. Run **`NAB: Export Translations to .csv (Select columns and filter)`**
2. Select desired columns
3. Apply filters
4. Export to CSV

**See also:**
- [NAB: Export Translations to .csv](#nab-export-translations-to-csv)

### NAB: Import Translations from .csv

**Purpose:** Import translations from CSV file

**When to use:**
- Receiving translations from external translator
- Importing from Excel/CSV workflow
- Batch updating translations

**What it does:**
1. Reads CSV file
2. Matches translations by ID
3. Updates XLF file targets
4. Validates format and content

**CSV requirements:**
- Must have ID column
- Must have Target column
- IDs must match XLF trans-units

**Usage:**
1. Prepare CSV with translations
2. Open target XLF file
3. Run **`NAB: Import Translations from .csv`**
4. Select CSV file
5. Translations imported

**Settings:**
- `NAB.ignoreMissingTransUnitsOnImport` - Ignore missing IDs
- `NAB.importTranslationWithDifferentSource` - Allow source mismatch

**See also:**
- [NAB: Export Translations to .csv](#nab-export-translations-to-csv)

## Supporting Features

### NAB: Find multiple targets in XLF files

**Purpose:** Find trans-units with multiple target elements

**When to use:**
- Translation matching found multiple options
- Verifying no duplicate targets remain
- Cleaning up after matching

**What it does:**
- Searches for trans-units with 2+ `<target>` elements
- Uses VS Code "Find in Files"
- Shows all occurrences

**Why multiple targets occur:**
- `NAB.MatchTranslation` found multiple different translations
- Each match added as separate target
- Manual review needed to choose correct one

**Usage:**
1. Run **`NAB: Find multiple targets in XLF files`**
2. Review search results
3. Open each file
4. Keep correct target, remove others

**Example:**
```xml
<trans-unit id="123">
  <source>Customer</source>
  <target>[NAB: SUGGESTION] Kunde</target>
  <target>[NAB: SUGGESTION] Debitor</target>
</trans-unit>
```
Choose one, remove the other.

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### Show translations on hover

**Purpose:** Display translations when hovering over AL code

**When to use:**
- Want quick translation reference
- Checking translations without switching files
- Verifying translation consistency

**What it does:**
1. Detects translatable text in AL code
2. Shows hover popup with all translations
3. Links to XLF files for editing

**Settings:**
- `NAB.EnableTranslationsOnHover` - Enable/disable (default: enabled)

**Recommendation:**
Disable for very large XLF files (performance impact).

**Usage:**
1. Hover over translatable text in AL code
2. View popup with translations
3. Click link to open XLF at translation

**Example:**
Hover over `Caption = 'Customer Name';` shows:
```
Translations:
da-DK: Kundenavn (link)
sv-SE: Kundnamn (link)
nb-NO: Kundenavn (link)
```

**See also:**
- [Translation Workflow](../guides/translation-workflow.md)

### NAB: Download Base App Translation files

**Purpose:** Download and cache Microsoft BaseApp translations

**When to use:**
- Preparing to use BaseApp matching
- Want offline access to BC translations
- Manually updating translation cache

**What it does:**
1. Identifies target languages in workspace
2. Downloads BaseApp translations for those languages
3. Caches files locally (5-10MB each)
4. Files stored in extension folder

**Usage:**
1. Run **`NAB: Download Base App Translation files`**
2. Downloads for detected languages
3. Files cached for future use

**Note:** This feature is a preview and may be automated in future.

**See also:**
- [NAB: Match Translations From Base Application](#nab-match-translations-from-base-application)

## Key Settings

### Translation Mode

**`NAB.UseTargetStates`**
- **Type:** boolean
- **Default:** false
- **Description:** Use XLIFF state attributes instead of NAB tags

**When to enable:**
- Using external translation tools
- Working with professional translators
- AI-assisted workflows

**See:** [Target States vs NAB Tags](target-states-vs-nab-tags.md)

### Translation Matching

**`NAB.MatchTranslation`**
- **Type:** boolean
- **Default:** true
- **Description:** Enable automatic translation matching from various sources

**Sources searched:**
1. Current XLF file
2. Other workspace XLF files
3. BaseApp translations (if downloaded)
4. Custom suggestion paths (if configured)

**`NAB.TranslationSuggestionPaths`**
- **Type:** array
- **Default:** []
- **Description:** Custom paths to search for translation matches

**Example:**
```json
{
  "NAB.TranslationSuggestionPaths": [
    "C:/Projects/OtherApp/Translations",
    "../SharedTranslations"
  ]
}
```

### Auto-Accept Suggestions

**`NAB.AutoAcceptSuggestions`**
- **Type:** boolean
- **Default:** false
- **Description:** Auto-accept first matched translation (NAB tags mode only)

**When to enable:**
- Trust your matching sources
- Want to skip suggestion review
- Large volumes with reliable matches

### Target States Settings

**`NAB.SetExactMatchToState`**
- **Type:** enum
- **Default:** (empty)
- **Options:** "translated", "signed-off", "final"
- **Description:** State to set when exact match found (target states mode)

**Example:**
```json
{
  "NAB.UseTargetStates": true,
  "NAB.SetExactMatchToState": "translated"
}
```

**`NAB.ClearTargetWhenSourceHasChanged`**
- **Type:** boolean
- **Default:** false
- **Description:** Clear target when source changes (target states mode)

### Skip Translation Properties

**`NAB.SkipTranslationPropertyForLanguage`**
- **Type:** array of objects
- **Default:** []
- **Description:** Skip specific properties for specific languages

**Example:**
```json
{
  "NAB.SkipTranslationPropertyForLanguage": [
    {
      "language": "da-DK",
      "properties": ["ToolTip", "AboutTitle"],
      "keepTranslated": false
    }
  ]
}
```

**Use case:** Don't translate tooltips for certain languages.

### Translation Comments

**`NAB.LanguageCodesInComments`**
- **Type:** array
- **Default:** []
- **Description:** Enable translations in AL code comments

**Example AL code:**
```al
Caption = 'Customer'; // da-DK='Kunde', sv-SE='Kund'
```

**`NAB.RemoveTranslationCommentsAfterUse`**
- **Type:** boolean  
- **Default:** false
- **Description:** Remove comments after applying to XLF

### File Handling

**`NAB.PreserveOriginalAttribute`**
- **Type:** boolean
- **Default:** false
- **Description:** Match 'original' attribute between g.xlf and language files

**When to enable:**
- Using tools requiring matching 'original' attribute (e.g., Crowdin)

**`NAB.TranslationFilenamePattern`**
- **Type:** string
- **Default:** "*.xlf"
- **Description:** Pattern for translation files

**Use case:** Filter when Translations folder has non-BC XLF files.

### Advanced Settings

**`NAB.SearchReplaceBeforeSaveXliff`**
- **Type:** array of objects
- **Default:** []
- **Description:** Regex search/replace before saving XLF

**Example:**
```json
{
  "NAB.SearchReplaceBeforeSaveXliff": [
    {
      "searchFor": "\\[OLD\\]",
      "replaceWith": "[NEW]",
      "regEx": true
    }
  ]
}
```

**`NAB.ShowXlfHighlights`**
- **Type:** boolean
- **Default:** true
- **Description:** Highlight translation issues in editor

**`NAB.DetectInvalidTargets`**
- **Type:** boolean
- **Default:** true
- **Description:** Detect and highlight invalid translation targets

**`NAB.PreferLockedTranslations`**
- **Type:** boolean
- **Default:** true
- **Description:** Be opinionated about locked translations

## Common Workflows

### Basic Translation Workflow

1. Write AL code
2. Build application (`F5` or `Ctrl+Shift+B`)
3. Run **`NAB: Refresh XLF files from g.xlf`**
4. Press `Ctrl+Alt+U` to find untranslated
5. Translate text
6. Repeat step 4-5 until complete
7. Save files
8. Commit to source control

### Adding New Language

1. Run **`NAB: Create translation XLF for new language`**
2. Enter language code
3. Choose BaseApp matching
4. Follow basic workflow to complete

### Using External Translator

1. Run **`NAB: Refresh XLF files from g.xlf`**
2. Run **`NAB: Export Translations to .csv`**
3. Send CSV to translator
4. Receive translated CSV
5. Run **`NAB: Import Translations from .csv`**
6. Review with `Ctrl+Alt+U`

### Translating Between Non-English Languages

1. Ensure source language complete
2. Run **`NAB: Create XLF with selected Source Language`**
3. Select source and target languages
4. Translate in intermediate file
5. Run **`NAB: Import Translations by Id`**
6. Verify import successful

## Troubleshooting

### g.xlf not found

**Symptom:** Commands fail with "Cannot find g.xlf file"

**Solution:**
1. Build AL project
2. Verify Translations folder exists
3. Check app.json name field
4. Try **`NAB: Update g.xlf`**

### Translations not updating

**Symptom:** Changes in AL don't appear in g.xlf

**Solution:**
1. Clean project
2. Delete objcache folder
3. Rebuild
4. Run refresh command

### Multiple targets appearing

**Symptom:** Trans-units have multiple target elements

**Cause:** Translation matching found multiple options

**Solution:**
1. Run **`NAB: Find multiple targets in XLF files`**
2. Review each case
3. Keep correct translation
4. Remove extra targets

### Hover not working

**Symptom:** No translations shown on hover

**Solution:**
1. Check `NAB.EnableTranslationsOnHover` setting
2. Rebuild AL project
3. Verify XLF files exist
4. Try reopening files

### Performance issues

**Symptom:** VS Code slow when editing AL code

**Cause:** Large XLF files with hover enabled

**Solution:**
Disable hover feature:
```json
{
  "NAB.EnableTranslationsOnHover": false
}
```

## See Also

- [Translation Workflow Guide](../guides/translation-workflow.md)
- [Translation Review Workflow](../guides/translation-review-workflow.md)
- [Target States vs NAB Tags](target-states-vs-nab-tags.md)
- [Glossary Management](glossary.md)
- [Language Model Tools](language-model-tools.md)
- [Settings Reference](../reference/settings.md)
