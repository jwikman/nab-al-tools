# XLF Translation Technical Rules

Technical preservation requirements for translating Business Central AL XLF/XLIFF files.

## Core Rules

### 1. Escape Sequences

**MUST preserve backslash sequences exactly - same count, same position. Never convert to actual newlines.**

```xml
<!-- CORRECT: Backslash count matches source -->
<source>First line\\Second line\\\Third line</source>
<target>Première ligne\\Deuxième ligne\\\Troisième ligne</target>

<source>Warning:\Data will be lost\\Proceed with caution</source>
<target>Advarsel:\Data vil gå tabt\\Fortsæt med forsigtighed</target>

<!-- WRONG: Actual line break instead of \\ -->
<source>First line\\Second line</source>
<target>Première ligne
Deuxième ligne</target>

<!-- WRONG: Changed backslash count (2 → 4) -->
<source>Line 1\\Line 2</source>
<target>Linje 1\\\\Linje 2</target>

<!-- WRONG: Changed backslash count (1 → 2) -->
<source>Path\a\Folder</source>
<target>Sti\en\\Mappe</target>
```

### 2. Placeholders

**MUST preserve %1, %2, %3 unchanged. Maintain order unless target grammar requires it.**

```xml
<source>Delete %1 records from table "%2"?</source>
<target>Slet %1 poster fra tabellen "%2"?</target>
```

### 3. XML Tags and Markup

**MUST maintain all XML structure exactly. Translate content only, never markup.**

```xml
<source>Click <g id="1">here</g> to continue</source>
<target>Klik <g id="1">her</g> for at fortsætte</target>
```

### 4. Length Constraints

**MUST respect maxLength when specified. Use abbreviations if needed.**

```
Source: "Customer Ledger Entry" (maxLength: 20)
✓ "Kundreskontra" (13 chars)
✗ "Kundekontoindgangspost" (25 chars)
```

### 5. Punctuation and Whitespace

**MUST preserve leading/trailing spaces, punctuation marks (!, ?, :, ;, ., etc.), special punctuation (—, –, …), quotes ('single' vs "double"), symbols (©, ®, ™, €, $, etc.).**

```xml
<source>Are you sure?!</source>
<target>Er du sikker?!</target>
```

### 6. Capitalization

**Follow target language conventions while respecting source intent (Title Case, ALL CAPS, etc.).**

```xml
<source>FINAL CONFIRMATION</source>
<target>ENDGYLDIG BEKRÆFTELSE</target>
```

### 7. Special Characters

**MUST preserve progress placeholders (#1####), non-breaking spaces, Unicode characters, all symbols exactly as they appear.**

```xml
<source>Processing\\Record: #1#####################</source>
<target>Behandler\\Post: #1#####################</target>
```

## Quick Validation

Before saving translations:

- [ ] Backslash sequences (`\` or `\\`) preserved exactly
- [ ] All %1, %2, etc. unchanged
- [ ] XML tags match source
- [ ] Within maxLength if specified
- [ ] Punctuation/whitespace intact

## References

- Business Central: Backslash sequences (`\` or `\\`) for line breaks and escaping in messages/labels
- AL: %1, %2, %3 for runtime value substitution
- XLIFF 1.2: XML structure and markup rules
