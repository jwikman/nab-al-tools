# XLF Review Workflow

Review workflow for translations in Business Central AL XLF files that need quality control.

## When to Use Review Workflow

Use this workflow when:

- Translations are flagged as "needs-review-translation" after translation
- User explicitly requests to review translations
- Final summary indicates translations need review

**Critical**: Translations in "needs-review" state must always be presented to the user for approval. Never automatically save them as "translated" without explicit user interaction. This is a strict workflow requirement.

## Review Process

### 0. Initialize Review Session

Before starting review for each language:

- **Sync file**: Call `refreshXlf` to ensure the XLF file is synchronized with the latest state
- **Load glossary**: Follow the **Glossary Initialization** process defined in the agent file
- **Note**: If coming directly from translation workflow, refreshXlf and glossary have already been loaded, but calling them again is safe and ensures consistency

### 1. Fetch Review Items

Use `getTranslatedTextsByState(targetState="needs-review-translation", limit=10)` to fetch items in batches of 10 (or user-specified batch size).

### 2. Present Batch for Review

For each batch, present in a **markdown table** for clean alignment:

```
Review Batch 1 (Items 1-10 of 45):

| # | Source | Current | Suggest | Reason | Alt | Context |
|-----|--------|---------|---------|--------|-----|---------|
| 1 | Customer Ledger Entry | Kundepost | **Kundreskontra** | glossary match | Kundreskontrapost | Table 21 - Object Name [Max: 30] |
| 2 | Post | Bogføre | **Bogføre** | Keep, matches glossary | - | Button - Property Caption |
| 3 | Currency Code | Valuta | **Valutakod** | more precise | Valutakod, Mynt | Field - Property Caption [Max: 10] |
| 4 | No. | Nr | **Nr** | Keep, standard BC | Nr., Nummer | Table LIB Book - Field No. |
| 5 | Description | Beskrivning | **Beskrivning** | Keep, matches glossary | - | Table LIB Book - Field Description |

Type numbers to ACCEPT suggestions (e.g., "1,3,5"), or "2:Custom Text" to modify, or "skip 4,6" to leave for later:
```

**Formatting Rules:**

- Use markdown table with columns: # | Source | Current | Suggest | Reason | Alt | Context
- Bold the suggested translation for visual clarity
- Use "-" for Alt column when no alternatives exist
- Keep Reason brief (e.g., "glossary match", "Keep, standard BC")
- Include [Max: X] in Context when maxLength constraint exists
- Comma-separate multiple alternatives in Alt column

### 3. Analysis & Suggestions

For each item:

- **Analyze alternatives**: Consider `alternativeTranslations` array if present
- **Apply glossary**: Check if glossary terms suggest a better translation
- **Length validation**: Verify translation fits maxLength constraint
- **Suggest best option**: Present the recommended translation with brief reason
- **Show alternatives**: List other options if available

### 4. User Input Patterns

Accept these response formats:

- **Accept suggestions**: `1,3,5` or `1-5` (apply agent suggestions)
- **Modify specific**: `2:Ny Tekst` (replace item 2 with "Ny Tekst")
- **Keep current**: `keep 2,4` (mark as final with current translation)
- **Skip for later**: `skip 6,7` (leave in needs-review state)
- **Accept all**: `Enter` or `all` (apply all suggestions)
- **Needs more review**: `review 3` (keep in needs-review with comment)

### 5. Save Batch

After user response:

- **Accepted/Modified items**: Save with `targetState="translated"`
- **Kept items**: Save with `targetState="final"` or `targetState="signed-off"`
- **Skipped items**: Leave unchanged in `targetState="needs-review-translation"`
- **Needs more review**: Keep in `targetState="needs-review-translation"` with updated comment

Use `saveTranslatedTexts` to persist changes.

### 6. Continue or Complete

- If more items remain: Fetch next batch and repeat
- If batch complete: Run `refreshXlf` and report final status
- User can stop at any time by typing `stop` or `done`

### 7. Review Session Summary

After completing review session, provide summary:

```
Review Session Complete:
- Accepted: 25 translations
- Modified: 8 translations
- Kept as-is: 3 translations
- Skipped: 9 translations (remain needs-review-translation)
```

## Review Quality Guidelines

### Translation Consistency

- Align with glossary terms for the target language
- Maintain consistency with prior translations in the session
- Use formal/neutral style appropriate for Business Central UI

### Technical Preservation

Follow all technical preservation rules defined in [xlf-translation-technical-rules.instructions.md](xlf-translation-technical-rules.instructions.md).

### Error Handling

When review encounters issues:

1. **Length violations**: Suggest shorter alternatives that maintain meaning
2. **Placeholder issues**: Flag for user clarification
3. **Glossary conflicts**: Present glossary term as primary suggestion
4. **Ambiguous context**: Request additional context from user

## Don't Ask About

- Whether to continue reviewing (continue until complete or user says stop)
- Permission to present next batch (automatic progression)
- Confirmation on each suggestion (user input handles all confirmations)
