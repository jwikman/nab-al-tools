---
name: review-translation-workflow
description: "Instructions for reviewing translations needing approval in XLF files using a structured workflow with LLM assistance"
---

# XLF Review Workflow

Review workflow for translations in Business Central AL XLF files that need quality control.

## When to Use Review Workflow

Use this workflow when:

- Translations are flagged as "needs-review-translation" after translation
- User explicitly requests to review translations
- Final summary indicates translations need review

**Critical**: Translations in "needs-review" state must always be presented to the user for approval. Never automatically save them as "translated" without explicit user interaction. This is a strict workflow requirement.

## Review Process

### Batch Size Guidelines

**Default batch size**: 10 items per batch (unless user specifies otherwise)

**Recommended maximum**: 100 items per batch

**MANDATORY: If user requests more than 100**:
- **MUST warn the user before proceeding** - this is not optional
- State clearly: "⚠️ Warning: Batch size of [requested amount] exceeds the recommended maximum of 100 items."
- Explain the risks:
  - "Large batches can reduce translation quality and accuracy"
  - "Processing many items at once makes review sessions harder to manage"
  - "Performance may degrade with large batches"
- Recommend: "I strongly recommend using batches of 100 items or less."
- Ask for confirmation: "Would you like to proceed with [requested amount], or shall I use 100 instead?"
- **Only proceed with the larger size after receiving explicit confirmation**

### 0. Initialize Review Session

Before starting review for each language:

- **Sync file**: Call `refreshXlf` to ensure the XLF file is synchronized with the latest state
- **Load glossary**: Follow the **Glossary Initialization** process defined in the agent file
- **Note**: If coming directly from translation workflow, refreshXlf and glossary have already been loaded, but calling them again is safe and ensures consistency

### 1. Fetch Review Items

Before starting, determine total count of items needing review:
- Call `getTranslatedTextsByState(targetState="needs-review-translation", limit=1)` to get total count from result metadata
- Determine batch size: Use 10 by default, or user-specified size (max 100 - see Batch Size Guidelines)
- Calculate total batches: `Math.ceil(totalCount / batchSize)`

Then fetch first batch using `getTranslatedTextsByState(targetState="needs-review-translation", limit=batchSize)`.

### 2. Present Batch for Review

For each batch, present in a **markdown table** for clean alignment:

**Progress Tracking**: Always show "Batch X of Y" and "Items A-B of Total" so it's clear more work remains.

```
Review Batch 1 of 5 (Items 1-10 of 45):

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

### 6. Automatic Continuation

**CRITICAL**: Review continues automatically across ALL batches until complete. Do NOT stop after one batch.

**Continuation Logic:**
- After saving batch, immediately check: Are there more items to review?
- If YES: Fetch next batch (Step 1) and continue without asking permission
- If NO: Proceed to Step 7 (final summary)
- User can interrupt at any time by typing `stop` or `done`

**Example flow:**
- Batch 1 complete → Immediately fetch Batch 2
- Batch 2 complete → Immediately fetch Batch 3
- Batch 5 complete → No more items → Final summary

**Never say**: "Review complete" or "Task done" until ALL batches are processed.

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

**Prohibited Questions/Statements** - Never do these:

- ❌ "Should I continue reviewing?" → Continue automatically
- ❌ "Would you like me to review the next batch?" → Continue automatically
- ❌ "Review complete" after one batch when more remain → Check total count
- ❌ "I've reviewed the translations" when only processed 10 of 45 → Continue to all batches
- ❌ Waiting for permission to continue → Automatic progression
- ❌ Asking for confirmation on each suggestion → User input handles all confirmations

**Required Behavior:**
- ✅ Show progress: "Batch 2 of 5 complete, continuing..."
- ✅ Continue until: All batches done OR user types "stop"/"done"
- ✅ Final summary only when: No more items remain in needs-review state
