---
name: review-translation-workflow
description: "Instructions for reviewing translations needing approval in XLF files using a structured workflow with LLM assistance"
---

# XLF Review Workflow

Review workflow for translations in Business Central AL XLF files that need quality control.

## Reading Tool Results

Tool results may be written to disk when they exceed ~8KB. When this happens:

1. Use `read_file` with `startLine=1, endLine=2000` to read the full content
2. If the file is larger than 2000 lines, continue with additional `read_file` calls using the next range
3. Always read the complete tool result before processing — do not rely on truncated previews

## When to Use Review Workflow

- Translations flagged as "needs-review-translation" after translation
- User explicitly requests review
- Final summary indicates translations need review

**Critical**: Translations in "needs-review" state must always be presented to the user for approval. Never automatically save as "translated" without explicit user interaction.

## Review Process

### Batch Size Guidelines

**Default**: 10 items | **Maximum recommended**: 100 items

**If user requests >100**: MUST warn before proceeding — "Large batches reduce quality, complicate review, and may degrade performance. Recommend ≤100." Only proceed after explicit confirmation.

### 0. Initialize Review Session

- **Sync**: `refreshXlf` to ensure current state
- **Load glossary**: Follow Glossary Initialization from agent file
- If coming from translation workflow, these are already loaded but safe to repeat

### 1. Fetch Review Items

- Get total count: `getTranslatedTextsByState(targetState="needs-review-translation", limit=1)` (metadata)
- Batch size: 10 default or user-specified (max 100)
- Calculate total batches: `Math.ceil(totalCount / batchSize)`
- Fetch first batch: `getTranslatedTextsByState(targetState="needs-review-translation", limit=batchSize)`

### 2. Present Batch for Review

For each batch, present in a **markdown table** for clean alignment:

**Progress Tracking**: Always show "Batch X of Y" and "Items A-B of Total" so it's clear more work remains.

```
Review Batch 1 of 5 (Items 1-10 of 45):

| # | Source | Current | Suggest | Reason | Alt | Context |
|-----|--------|---------|---------|--------|-----|---------|
| 1 | Customer Ledger Entry | Kundepost | **Kundreskontra** | glossary match | Kundreskontrapost | Table 21 - Object Name [13 chars, Max: 30] |
| 2 | Post | Bogføre | **Bogføre** | Keep, matches glossary | - | Button - Property Caption |
| 3 | Currency Code | Valuta | **Valutakod** | more precise | Valutakod, Mynt | Field - Property Caption [9 chars, Max: 10] |
| 4 | No. | Nr | **Nr** | Keep, standard BC | Nr., Nummer | Table LIB Book - Field No. |
| 5 | Description | Beskrivning | **Beskrivning** | Keep, matches glossary | - | Table LIB Book - Field Description |

Type numbers to ACCEPT suggestions (e.g., "1,3,5"), or "2:Custom Text" to modify, or "skip 4,6" to leave for later:
```

**Formatting Rules:**

- Use markdown table with columns: # | Source | Current | Suggest | Reason | Alt | Context
- Bold the suggested translation for visual clarity
- Use "-" for Alt column when no alternatives exist
- Keep Reason brief (e.g., "glossary match", "Keep, standard BC")
- Include [Y chars, Max: X] in Context when maxLength constraint exists, where Y is the explicit character count of the suggested translation and X is the limit
- Comma-separate multiple alternatives in Alt column

### 3. Analysis & Suggestions

For each item:

- **Alternatives**: Consider `alternativeTranslations` array
- **Glossary**: Check for better translations
- **Length**: Count chars for every suggestion where `maxLength` set; shorten if exceeds limit. Show `[Y chars, Max: X]`. Never present a violating suggestion
- **Source copy**: If current equals source without justification, produce proper translation (mark "likely source copy")
- **Suggest best option** with brief reason; show alternatives if available

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

### 6. Automatic Continuation

**Review continues automatically across ALL batches until complete.** After saving batch, immediately fetch next. User can type `stop`/`done` to interrupt.

Never say "Review complete" until ALL batches are processed.

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

- Align with glossary terms
- Maintain consistency with prior translations in session
- Formal/neutral style for BC UI

### Technical Preservation

Follow [xlf-translation-technical-rules.instructions.md](xlf-translation-technical-rules.instructions.md).

### Error Handling

1. **Length violations**: Caught in Analysis (Step 3); if found later, suggest shorter alternative with `[Y chars, Max: X]`
2. **Source copy**: Produce proper translation, mark "likely source copy"
3. **Placeholder issues**: Flag for user
4. **Glossary conflicts**: Present glossary term as primary
5. **Ambiguous context**: Request context from user

## Don't Ask About

- ❌ "Should I continue?" / "Would you like next batch?" → Continue automatically
- ❌ "Review complete" after one batch when more remain
- ❌ Wait for permission → Automatic progression
- ❌ Ask confirmation per suggestion → User input handles all

**Required:**

- ✅ Show progress: "Batch 2 of 5 complete, continuing..."
- ✅ Continue until all done OR user types "stop"/"done"
- ✅ Final summary only when no items remain
