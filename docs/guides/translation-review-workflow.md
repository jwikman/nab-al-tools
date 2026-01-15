# Translation Review Workflow Guide

This guide explains how to review and approve translations in NAB AL Tools, ensuring quality and accuracy before deployment.

## Overview

Translation review is a quality assurance process where translations are checked for:
- Accuracy and correctness
- Terminology consistency
- Proper formatting and placeholders
- Cultural appropriateness
- Character length constraints

NAB AL Tools supports both manual and AI-assisted review workflows.

## Prerequisites

- Completed initial translations (see [Translation Workflow](translation-workflow.md))
- VS Code with NAB AL Tools extension
- Understanding of [Target States vs NAB Tags](../features/target-states-vs-nab-tags.md)

## Review Workflow Modes

### Manual Review

Review translations directly in XLF files using VS Code.

**Best for:**
- Small translation volumes
- Direct control over review decisions
- Learning and quality training
- Final verification step

### AI-Assisted Review

Use GitHub Copilot and the NAB-XLF-Translator agent for automated review.

**Best for:**
- Large translation volumes
- Consistency checking across files
- Terminology validation
- First-pass quality screening

## Manual Review Process

### Step 1: Identify Translations Needing Review

#### NAB Tags Mode

Find translations marked for review:

```xml
<target>[NAB: REVIEW] Translated text that needs checking</target>
```

**How to find:**
1. Open XLF file
2. Press `Ctrl+Alt+U` or run **`NAB: Find next untranslated text`**
3. Tags in order: `[NAB: NOT TRANSLATED]`, `[NAB: REVIEW]`, `[NAB: SUGGESTION]`

#### Target States Mode

Find translations with review states:

```xml
<target state="needs-review-translation">Translation needing review</target>
<target state="needs-adaptation">Translation after source changed</target>
```

**How to find:**
1. Open XLF file
2. Press `Ctrl+Alt+U` or run **`NAB: Find next untranslated text`**
3. Searches for states: `needs-review-translation`, `needs-adaptation`, `needs-translation`, `new`

### Step 2: Review Context

Before reviewing, understand the context:

**Source code reference:**
1. Position cursor in the trans-unit
2. Press `F12` or run **`NAB: Find source of current Translation Unit`**
3. Opens the AL code where this text is used

**Check trans-unit details:**
```xml
<trans-unit id="Table 2328716850 - Field 2968997166 - Property 2879900210">
  <source>Customer Name</source>
  <target state="needs-review-translation">Kundenavn</target>
  <note from="Developer" annotates="general" priority="1">
    The customer's full name
  </note>
  <note from="Xliff Generator" annotates="general" priority="3">
    Table MyTable - Field CustomerName - Property Caption
  </note>
</trans-unit>
```

**Context clues:**
- `id` attribute shows object type and property
- Developer notes explain usage
- Xliff Generator notes show object hierarchy
- Source text provides original meaning

### Step 3: Review Translation Quality

Check each translation against these criteria:

#### 1. Accuracy

**Question:** Does the translation accurately convey the source meaning?

**Check:**
- ✅ Meaning is preserved
- ✅ No information lost or added
- ✅ Appropriate for context (field caption, button, message, etc.)

**Example:**
```xml
<!-- Good -->
<source>Post and Send</source>
<target>Bogfør og send</target>

<!-- Bad - missing action -->
<source>Post and Send</source>
<target>Bogfør</target>
```

#### 2. Placeholders

**Question:** Are all placeholders preserved and positioned correctly?

**Placeholders:** `%1`, `%2`, `%3`, `%4`, etc.

**Check:**
- ✅ All placeholders present
- ✅ Correct order (or adjusted for grammar)
- ✅ No extra or missing placeholders

**Example:**
```xml
<!-- Good -->
<source>Post %1 %2 entries?</source>
<target>Bogfør %1 %2 poster?</target>

<!-- Bad - missing %2 -->
<source>Post %1 %2 entries?</source>
<target>Bogfør %1 poster?</target>

<!-- Good - reordered for grammar -->
<source>Copy %1 from %2</source>
<target>Kopier fra %2 til %1</target>
```

#### 3. Formatting Tags

**Question:** Are HTML/XML tags preserved?

**Common tags:** `<b>`, `<i>`, `<br/>`, etc.

**Check:**
- ✅ All tags present
- ✅ Tags properly closed
- ✅ Tags in logical position

**Example:**
```xml
<!-- Good -->
<source>Click <b>OK</b> to continue</source>
<target>Klik <b>OK</b> for at fortsætte</target>

<!-- Bad - missing tags -->
<source>Click <b>OK</b> to continue</source>
<target>Klik OK for at fortsætte</target>
```

#### 4. Character Length

**Question:** Does the translation fit within any maximum length constraint?

**Check for maxwidth or size-unit attributes:**
```xml
<trans-unit maxwidth="20">
  <source>Customer</source>
  <target>Kunde</target> <!-- 5 chars, fits in 20 -->
</trans-unit>
```

**Guidelines:**
- ✅ Translation shorter than maxwidth
- ⚠️ If longer, consider abbreviation
- ⚠️ Test in UI if close to limit

#### 5. Terminology Consistency

**Question:** Is terminology consistent with glossary and other translations?

**Check:**
- ✅ Standard BC terms match glossary
- ✅ Project-specific terms consistent
- ✅ Same source translated consistently

**Use glossary:**
1. Review built-in BC glossary terms
2. Check local project glossary (if exists)
3. Use **`NAB: Find translated texts of current line`** to see other translations

**Example - maintain consistency:**
```xml
<!-- Translation 1 -->
<source>Customer</source>
<target>Kunde</target>

<!-- Translation 2 - should match -->
<source>Customer No.</source>
<target>Kundenr.</target> <!-- Uses same "Kunde" root -->
```

#### 6. Cultural Appropriateness

**Question:** Is the translation appropriate for the target culture?

**Check:**
- ✅ Natural phrasing for target language
- ✅ Culturally appropriate terms
- ✅ Proper formality level

**Example:**
```xml
<!-- Danish uses informal "you" in BC -->
<source>You must specify a value</source>
<target>Du skal angive en værdi</target> <!-- "Du" not "De" -->
```

### Step 4: Make Review Decision

After checking the translation:

#### Accept Translation

**NAB Tags mode:**
1. Remove the `[NAB: REVIEW]` or `[NAB: SUGGESTION]` tag
2. Save file

```xml
<!-- Before -->
<target>[NAB: REVIEW] Kundenavn</target>

<!-- After -->
<target>Kundenavn</target>
```

**Target States mode:**
1. Change state to `translated`, `signed-off`, or `final`
2. Save file

```xml
<!-- Before -->
<target state="needs-review-translation">Kundenavn</target>

<!-- After -->
<target state="translated">Kundenavn</target>
```

#### Modify Translation

**NAB Tags mode:**
1. Update the translation text
2. Remove the tag
3. Save file

```xml
<!-- Before -->
<target>[NAB: REVIEW] Kunde navn</target>

<!-- After - improved -->
<target>Kundenavn</target>
```

**Target States mode:**
1. Update the translation text
2. Change state to appropriate value
3. Save file

```xml
<!-- Before -->
<target state="needs-adaptation">Kunde navn</target>

<!-- After - improved -->
<target state="translated">Kundenavn</target>
```

#### Reject Translation (Request Re-translation)

**NAB Tags mode:**
1. Replace translation with `[NAB: NOT TRANSLATED]`
2. Add note explaining reason
3. Save file

```xml
<trans-unit>
  <source>Customer Name</source>
  <target>[NAB: NOT TRANSLATED]</target>
  <note from="Reviewer" priority="1">
    Previous translation was incorrect. Needs re-translation.
  </note>
</trans-unit>
```

**Target States mode:**
1. Clear the target or set to appropriate text
2. Change state to `needs-translation`
3. Add note explaining reason
4. Save file

```xml
<trans-unit>
  <source>Customer Name</source>
  <target state="needs-translation"></target>
  <note from="Reviewer" priority="1">
    Previous translation was incorrect. Needs re-translation.
  </note>
</trans-unit>
```

### Step 5: Track Review Progress

Monitor review completion:

**Check remaining reviews:**
1. Run **`NAB: Find untranslated texts`**
2. Review search results
3. Count remaining items

**Verify completion:**
- NAB Tags: No `[NAB: REVIEW]` or `[NAB: SUGGESTION]` tags remain
- Target States: No `needs-review-translation` or `needs-adaptation` states remain

## AI-Assisted Review Workflow

### Using the reviewXlfFiles Prompt

The NAB-XLF-Translator agent can automate much of the review process.

**Prerequisites:**
- GitHub Copilot with chat enabled
- NAB AL Tools extension
- Translations completed (manually or via AI)

### Step 1: Start Review

1. Open any file from your AL application
2. Open GitHub Copilot Chat
3. Run the review prompt:

```
/reviewXlfFiles
```

**Or specify language(s):**
```
/reviewXlfFiles Danish
/reviewXlfFiles Norwegian and Swedish
```

### Step 2: Agent Review Process

The agent automatically:

1. **Identifies Application**
   - Detects AL app from context
   - Locates XLF files

2. **Retrieves Review Items**
   - Gets translations with review states
   - Filters by specified languages
   - Includes review reasons and context

3. **Reviews Each Translation**
   - Checks accuracy against source
   - Validates placeholders and formatting
   - Verifies terminology consistency
   - Applies glossary terms
   - Checks character lengths

4. **Makes Review Decisions**
   - Accepts correct translations
   - Suggests improvements where needed
   - Marks for re-translation if necessary

5. **Updates States**
   - Sets appropriate states based on review
   - Adds review notes where helpful
   - Saves changes to files

6. **Provides Summary**
   - Reports accepted translations
   - Lists improved translations
   - Notes any issues requiring attention

### Step 3: Verify AI Review

After AI review completes:

**Manual spot check:**
1. Open a few reviewed translations
2. Verify quality meets standards
3. Check critical translations manually

**Verify completion:**
```
/reviewXlfFiles
```

If no items need review, agent reports all complete.

### Batch Review Workflow

For large volumes, review in batches:

**Approve batch:**
1. Run `/reviewXlfFiles`
2. Agent processes first batch (typically 50-100 items)
3. Review summary and any issues
4. Run again for next batch
5. Repeat until complete

**Benefits:**
- Progress tracking between batches
- Opportunity to spot-check results
- Manage review workload
- Handle large translation sets

## Review States and Transitions

### NAB Tags Mode States

```
[NAB: NOT TRANSLATED]
         ↓ (translate)
[NAB: REVIEW] or [NAB: SUGGESTION]
         ↓ (review and approve)
   [No tag] - Complete
```

**Transitions:**
- New → `[NAB: NOT TRANSLATED]`
- Translated → `[No tag]`
- Source changed → `[NAB: REVIEW]`
- Match found → `[NAB: SUGGESTION]`
- Review approved → Remove tag

### Target States Mode States

```
        new / needs-translation
               ↓ (translate)
needs-review-translation / needs-adaptation
               ↓ (review)
           translated
               ↓ (sign-off)
            signed-off
               ↓ (final approval)
              final
```

**Transitions:**
- `new` → `translated` (direct translation)
- `needs-translation` → `translated` (after translation)
- `needs-review-translation` → `translated` (after review)
- `needs-adaptation` → `translated` (after adaptation)
- `translated` → `signed-off` (after review approval)
- `signed-off` → `final` (after final approval)

**Backward transitions (quality issues):**
- Any state → `needs-translation` (reject, request re-translation)
- `signed-off` → `needs-review-translation` (request re-review)

## Review Best Practices

### Quality Standards

Define clear quality criteria:

1. **Translation accuracy** - Minimum standard
2. **Terminology consistency** - Required
3. **Format preservation** - Mandatory
4. **Cultural fit** - Expected
5. **Length constraints** - Must comply

### Review Checklist

For each translation, verify:

- [ ] Meaning accurately conveyed
- [ ] All placeholders present and correct
- [ ] All formatting tags preserved
- [ ] Character length within limits
- [ ] Terminology matches glossary
- [ ] Natural phrasing for target language
- [ ] Appropriate formality level
- [ ] Consistent with related translations

### Reviewer Guidelines

**Do:**
- ✅ Review in context (check AL source code)
- ✅ Use glossaries for consistency
- ✅ Check related translations
- ✅ Consider UI space constraints
- ✅ Add notes for complex decisions
- ✅ Test translations in running application

**Don't:**
- ❌ Accept translations without checking
- ❌ Ignore placeholder errors
- ❌ Skip character length validation
- ❌ Allow inconsistent terminology
- ❌ Forget cultural appropriateness

### Batch Review Tips

When reviewing large volumes:

1. **Group by type** - Review similar translations together (e.g., all captions)
2. **Use patterns** - Establish patterns for common translations
3. **Take breaks** - Avoid fatigue affecting quality
4. **Track progress** - Monitor completion percentage
5. **Spot check** - Regularly verify earlier reviews remain consistent

## Common Review Issues

### Placeholder Problems

**Issue:** Missing or incorrect placeholders

**Example:**
```xml
<source>Post %1 %2 entries?</source>
<target>Bogfør poster?</target> <!-- Missing both %1 and %2 -->
```

**Solution:**
1. Reject translation
2. Add note: "Missing placeholders %1 and %2"
3. Request re-translation

### Length Violations

**Issue:** Translation exceeds character limit

**Example:**
```xml
<trans-unit maxwidth="15">
  <source>Customer</source>
  <target>Kundeoplysninger</target> <!-- 17 chars, exceeds 15 -->
</trans-unit>
```

**Solutions:**
- Use abbreviation: "Kundeinfo" (10 chars)
- Use shorter synonym: "Kunde" (5 chars)
- Consult with developer if no good short option

### Terminology Inconsistency

**Issue:** Same source term translated differently

**Example:**
```xml
<!-- Translation 1 -->
<source>Customer</source>
<target>Kunde</target>

<!-- Translation 2 - inconsistent -->
<source>Customer No.</source>
<target>Debitor nr.</target> <!-- Should be "Kunde nr." -->
```

**Solution:**
1. Check glossary for standard term
2. Search for other uses: **`NAB: Find translated texts of current line`**
3. Choose consistent term
4. Update all inconsistent translations

### Cultural Mismatch

**Issue:** Translation technically correct but culturally awkward

**Example:**
```xml
<source>You must specify a customer</source>
<target>Man skal angive en kunde</target> <!-- Too formal for Danish BC -->
<!-- Better: "Du skal angive en kunde" -->
```

**Solution:**
1. Consult native speaker
2. Check standard BC translations
3. Apply appropriate formality level

## Specialized Review Types

### Tooltip Review

Tooltips require special attention:

**Check:**
- Clear and helpful explanation
- Complete sentences
- User-friendly language
- No technical jargon (unless necessary)
- Proper use of %1, %2 for field references

**Example:**
```xml
<!-- Good tooltip -->
<source>Specifies the customer's name</source>
<target>Angiver kundens navn</target>

<!-- Bad - too technical -->
<source>Specifies the customer's name</source>
<target>Angiver værdien af kunde-navn feltet</target>
```

### Error Message Review

Error messages need extra care:

**Check:**
- Clear problem statement
- Actionable guidance
- Appropriate tone (not blaming user)
- Correct placeholders for variable info

**Example:**
```xml
<!-- Good error message -->
<source>%1 must have a value in %2</source>
<target>%1 skal have en værdi i %2</target>

<!-- Bad - vague -->
<source>%1 must have a value in %2</source>
<target>Fejl i %2</target> <!-- Doesn't explain what's wrong -->
```

### UI Label Review

UI labels must be concise:

**Check:**
- Fits in UI space (character limit)
- Clear and unambiguous
- Consistent with related labels
- Action-oriented for buttons

**Example:**
```xml
<!-- Good button label -->
<source>Post and Send</source>
<target>Bogfør og send</target>

<!-- Bad - too long -->
<source>Post and Send</source>
<target>Bogfør og send dokumentet</target>
```

## Review Workflow Settings

### Relevant Settings

**For all modes:**
- `NAB.ShowXlfHighlights` - Highlight translation issues in editor
- `NAB.DetectInvalidTargets` - Detect invalid translations automatically

**For Target States mode:**
- `NAB.UseTargetStates`: `true`
- Define your state transition workflow
- Consider using `signed-off` for reviewed translations

### XLIFF Editor Integration

NAB AL Tools provides a specialized XLIFF editor with review features:

**Open XLIFF Editor:**
- Run **`NAB: Edit Xliff Document`**
- Select XLF file to edit

**Editor features:**
- Visual representation of translations
- Filter by state or tag
- Checkbox-based approval
- Review statistics

**Benefits:**
- Easier batch review
- Visual progress tracking
- Less error-prone than raw XML editing

## Testing Reviewed Translations

After review, test in Business Central:

### Test Process

1. **Build application** with reviewed translations
2. **Deploy to BC** environment
3. **Change language** to target language
4. **Navigate UI** checking translations
5. **Trigger messages** to verify error texts
6. **Check tooltips** on fields and actions

### What to Check

- **Fit in UI** - Translations don't overflow
- **Make sense** - Translations clear in context
- **Correct placeholders** - Variable values appear correctly
- **Consistent** - Related terms use same translations
- **Natural** - Phrasing feels natural in target language

### Common UI Issues

**Truncation:**
- Translation too long for field
- Text cut off with "..."
- Solution: Use shorter synonym or abbreviation

**Formatting:**
- Line breaks in wrong places
- Visual alignment issues
- Solution: Adjust translation length or phrasing

**Placeholder problems:**
- Variable values not appearing
- Strange text like "%1" showing to users
- Solution: Verify placeholder preservation in translation

## Next Steps

After completing review:

1. **Commit reviewed translations** to source control
2. **Update translation status** in project tracking
3. **Deploy to test environment** for validation
4. **Gather user feedback** from target language users
5. **Iterate** based on feedback

## See Also

- [Translation Workflow Guide](translation-workflow.md) - Initial translation process
- [Target States vs NAB Tags](../features/target-states-vs-nab-tags.md) - Understanding translation modes
- [XLIFF Tools](../features/xliff-tools.md) - All translation commands
- [Language Model Tools](../features/language-model-tools.md) - AI-assisted workflows
- [Glossary Management](../features/glossary.md) - Maintaining terminology
