# Target States vs NAB Tags

A comprehensive comparison of the two translation modes in NAB AL Tools.

## Overview

NAB AL Tools supports two distinct approaches for managing translation status in XLIFF files:

1. **NAB Tags Mode** - Uses text markers in target elements
2. **Target States Mode** - Uses XLIFF standard state attributes

This document helps you choose the right mode for your workflow and understand how to use each effectively.

## Quick Comparison

| Feature | NAB Tags Mode | Target States Mode |
|---------|---------------|-------------------|
| **Default** | ✅ Yes (`UseTargetStates: false`) | ❌ No (`UseTargetStates: true`) |
| **Visual markers** | ✅ Clear text tags | ⚠️ XML attributes only |
| **Search friendly** | ✅ Ctrl+F works | ⚠️ Need XLF-aware search |
| **External tools** | ❌ May not understand tags | ✅ XLIFF standard |
| **Translation tools** | ❌ Limited support | ✅ Full support |
| **AI integration** | ✅ Supported | ✅ Recommended |
| **Simple editors** | ✅ Any text editor | ⚠️ Better with XLIFF editors |
| **Professional translators** | ❌ May cause confusion | ✅ Industry standard |

## NAB Tags Mode

### What It Is

NAB Tags mode uses searchable text markers inserted directly into the `<target>` element to indicate translation status.

### When to Use

**✅ Choose NAB Tags mode when:**
- Translating directly in VS Code
- Working without external translation tools
- Want simple, visual status indicators
- Using basic text editors
- Small team doing translations in-house
- Want to quickly search and find untranslated texts

**❌ Avoid NAB Tags mode when:**
- Working with professional translation agencies
- Using external translation management systems
- Need XLIFF-standard workflow
- Exporting files to translation tools

### How It Works

**Translation states are marked with text tags:**

```xml
<!-- Not translated -->
<target>[NAB: NOT TRANSLATED]</target>

<!-- Needs review (source changed) -->
<target>[NAB: REVIEW] Kunde navn</target>

<!-- Suggested by matching -->
<target>[NAB: SUGGESTION] Kundenavn</target>

<!-- Completed translation (no tag) -->
<target>Kundenavn</target>
```

### Tag Types

#### [NAB: NOT TRANSLATED]

**When added:**
- New translation units created
- Source language differs from target language
- No matching translation found

**What to do:**
1. Find with `Ctrl+Alt+U`
2. Replace entire tag with your translation
3. Save file

**Example:**
```xml
<!-- Before -->
<source>Customer Name</source>
<target>[NAB: NOT TRANSLATED]</target>

<!-- After -->
<source>Customer Name</source>
<target>Kundenavn</target>
```

#### [NAB: REVIEW]

**When added:**
- Source text was modified in AL code
- Translation may no longer be accurate
- Same source language as target language (text was copied)

**What to do:**
1. Find with `Ctrl+Alt+U`
2. Review if translation still fits modified source
3. Update translation if needed
4. Remove `[NAB: REVIEW]` tag
5. Save file

**Example:**
```xml
<!-- Before -->
<source>Customer Full Name</source>
<target>[NAB: REVIEW] Customer Name</target>

<!-- After reviewing -->
<source>Customer Full Name</source>
<target>Kundenavn (fuldt)</target>
```

#### [NAB: SUGGESTION]

**When added:**
- `NAB.MatchTranslation` found a potential match
- Multiple matches found for same source
- `NAB.AutoAcceptSuggestions` is disabled

**What to do:**
1. Find with `Ctrl+Alt+U`
2. Review suggested translation
3. Accept (remove tag) or modify
4. If multiple targets exist, remove extras
5. Save file

**Example:**
```xml
<!-- Before -->
<source>Customer</source>
<target>[NAB: SUGGESTION] Kunde</target>
<target>[NAB: SUGGESTION] Debitor</target>

<!-- After review (chose first, removed second) -->
<source>Customer</source>
<target>Kunde</target>
```

### Finding Texts to Translate

**Keyboard shortcut:** `Ctrl+Alt+U`

**Command:** **`NAB: Find next untranslated text`**

Searches for tags in this order:
1. `[NAB: NOT TRANSLATED]`
2. `[NAB: REVIEW]`
3. `[NAB: SUGGESTION]`

**Manual search:**
- Use `Ctrl+F` to find `[NAB:`
- Use **`NAB: Find untranslated texts`** for workspace-wide search

### Notes Feature

When tags are added, NAB AL Tools creates an explanatory note:

```xml
<trans-unit id="123" translate="yes">
  <source>Customer Name</source>
  <target>[NAB: NOT TRANSLATED]</target>
  <note from="NAB AL Tools">
    Source text not translated. Target language is different from source language.
  </note>
</trans-unit>
```

**Note behavior:**
- Added when tag is inserted
- Removed when tag is removed
- Identified by `from="NAB AL Tools"` attribute

### Advantages

✅ **Easy to find** - Simple text search with `Ctrl+F`
✅ **Visual clarity** - Status immediately visible
✅ **No special tools** - Works in any text editor
✅ **Simple workflow** - Remove tag when done
✅ **Quick learning** - Intuitive for developers

### Disadvantages

❌ **Non-standard** - Not part of XLIFF specification
❌ **External tools** - May not recognize tags
❌ **Professional workflow** - Not suitable for translation agencies
❌ **Automation** - Harder to integrate with TMS systems

### Configuration

**Enable NAB Tags mode:**
```json
{
  "NAB.UseTargetStates": false
}
```

**Related settings:**
- `NAB.AutoAcceptSuggestions` - Auto-accept first match (removes `[NAB: SUGGESTION]`)
- `NAB.MatchTranslation` - Enable matching to get suggestions

## Target States Mode

### What It Is

Target States mode uses the XLIFF standard `state` attribute on `<target>` elements to track translation status.

### When to Use

**✅ Choose Target States mode when:**
- Using external translation tools (Crowdin, MemoQ, SDL Trados)
- Working with professional translators
- AI-assisted translation workflows (GitHub Copilot)
- Need XLIFF-standard compliance
- Exporting files to translation management systems
- Want advanced translation workflow

**❌ Avoid Target States mode when:**
- Using only basic text editors
- Want simple visual markers
- No external tool integration needed
- Team unfamiliar with XLIFF standards

### How It Works

**Translation states are tracked using XML attributes:**

```xml
<!-- Not translated -->
<target state="new"></target>

<!-- Needs translation -->
<target state="needs-translation"></target>

<!-- Needs review (source changed) -->
<target state="needs-adaptation">Kundenavn</target>

<!-- Needs translation review -->
<target state="needs-review-translation">Kunde</target>

<!-- Translated (complete) -->
<target state="translated">Kundenavn</target>

<!-- Signed off (reviewed) -->
<target state="signed-off">Kundenavn</target>

<!-- Final (approved) -->
<target state="final">Kundenavn</target>
```

### XLIFF States Explained

#### new

**Meaning:** Translation unit just created, no translation attempted

**When set:**
- New trans-unit added from g.xlf
- Target language differs from source
- No previous translation exists

**Next action:** Translate the text

#### needs-translation

**Meaning:** Translation is required

**When set:**
- Source changed and target cleared
- Explicitly marked as needing translation
- Previous translation was removed

**Next action:** Provide translation

#### needs-adaptation

**Meaning:** Source text changed, translation needs updating

**When set:**
- Source text was modified in AL code
- Existing translation may no longer fit

**Next action:** Review and adapt translation for new source

#### needs-review-translation

**Meaning:** Translation exists but needs review

**When set:**
- Source and target languages are the same (text was copied)
- Translation suggested by matching (when configured)
- Translation imported but not verified

**Next action:** Review translation for correctness

#### translated

**Meaning:** Translation complete and ready for use

**When set:**
- Translation finished and saved
- Passed initial quality checks
- Ready for review workflow (if used)

**Next action:** Can be further reviewed (signed-off) or used as-is

#### signed-off

**Meaning:** Translation reviewed and approved

**When set:**
- Translation reviewed by second party
- Quality verified
- Approved for use

**Next action:** Can move to final state if additional approval needed

#### final

**Meaning:** Translation fully approved and locked

**When set:**
- All approval stages complete
- Translation frozen
- Ready for production

**Next action:** No further changes needed

### State Qualifiers

Provide additional context about how the state was reached:

```xml
<target state="translated" state-qualifier="exact-match">Kundenavn</target>
```

**Common qualifiers:**
- `exact-match` - Translation matched from previous source
- `mt-suggestion` - Machine translation suggestion
- `fuzzy-match` - Similar (but not exact) match found

**NAB AL Tools usage:**
- Sets `state-qualifier="exact-match"` when `NAB.SetExactMatchToState` is configured
- Indicates translation came from matching, not manual entry

### Finding Texts to Translate

**Keyboard shortcut:** `Ctrl+Alt+U`

**Command:** **`NAB: Find next untranslated text`**

Searches for targets with these states:
- `new`
- `needs-translation`
- `needs-adaptation`
- `needs-review-translation`
- Any target without a state attribute

**Does NOT find:**
- `translated`
- `signed-off`
- `final`

### Advantages

✅ **XLIFF standard** - Recognized by all professional tools
✅ **External tools** - Full compatibility with TMS systems
✅ **Professional workflow** - Supports complete translation pipeline
✅ **Rich states** - More granular status tracking
✅ **AI-friendly** - Better for automated workflows

### Disadvantages

❌ **Less visible** - Attributes not immediately visible in text
❌ **Search complexity** - Need XLF-aware tools to find states
❌ **Learning curve** - More complex than simple tags
❌ **Tooling** - Better with XLIFF-aware editors

### Configuration

**Enable Target States mode:**
```json
{
  "NAB.UseTargetStates": true
}
```

**Related settings:**
- `NAB.SetExactMatchToState` - State for exact matches (e.g., "translated", "signed-off")
- `NAB.ClearTargetWhenSourceHasChanged` - Clear target when source changes
- `NAB.MatchTranslation` - Enable matching (always auto-accepts first match in this mode)

## Choosing the Right Mode

### Decision Tree

```
Do you use external translation tools or agencies?
├─ Yes → Use Target States mode
└─ No
   │
   Do you use AI translation workflows?
   ├─ Yes → Target States mode recommended
   └─ No
      │
      Simple in-house translation in VS Code?
      ├─ Yes → Use NAB Tags mode
      └─ Complex workflow needs → Use Target States mode
```

### Use Case Examples

#### Small In-House Team
**Scenario:** 3 developers translating 2 languages themselves

**Recommendation:** NAB Tags mode
- Simple, visual workflow
- Easy to find and translate
- No external tools needed
- Quick learning curve

#### Professional Translation Agency
**Scenario:** Sending files to external translators

**Recommendation:** Target States mode
- Standard XLIFF workflow
- Compatible with professional tools
- Proper state management
- Industry best practices

#### AI-Assisted Translation
**Scenario:** Using GitHub Copilot for automated translation

**Recommendation:** Target States mode
- Better AI integration
- Richer state information
- Automated workflow support
- State-based review process

#### Mixed Workflow
**Scenario:** Combination of manual and external translation

**Recommendation:** Target States mode
- Flexibility for different processes
- Professional tool compatibility
- Can still work in VS Code
- Supports complex workflows

## Migration Between Modes

### Switching from NAB Tags to Target States

**Impact:**
- Existing `[NAB: *]` tags remain in target text
- New workflow uses state attributes
- No automatic conversion

**Recommended process:**
1. Complete all pending translations in NAB Tags mode
2. Remove all tags from targets
3. Change setting to `NAB.UseTargetStates: true`
4. Run **`NAB: Refresh XLF files from g.xlf`**
5. States will be set on next refresh

**Manual cleanup:**
- Search for `[NAB:` in XLF files
- Remove any remaining tags
- Ensure targets contain only translation text

### Switching from Target States to NAB Tags

**Impact:**
- State attributes remain but are ignored
- New workflow uses tags
- Existing translations unaffected

**Recommended process:**
1. Change setting to `NAB.UseTargetStates: false`
2. Run **`NAB: Refresh XLF files from g.xlf`**
3. Tags will be added where needed
4. State attributes remain but are not used

**Note:** State attributes won't cause problems but can be removed if desired

## Settings Interaction

### Settings that work with both modes

- ✅ `NAB.MatchTranslation` - Translation matching
- ✅ `NAB.LanguageCodesInComments` - AL code comments
- ✅ `NAB.RemoveTranslationCommentsAfterUse` - Remove comments
- ✅ `NAB.SkipTranslationPropertyForLanguage` - Skip properties
- ✅ `NAB.TranslationSuggestionPaths` - Custom matching paths

### Settings specific to NAB Tags mode

- `NAB.AutoAcceptSuggestions` - Auto-accept first match (bypasses `[NAB: SUGGESTION]`)

### Settings specific to Target States mode

- `NAB.SetExactMatchToState` - State to set for exact matches
- `NAB.ClearTargetWhenSourceHasChanged` - Clear target on source change

### Settings that behave differently

**`NAB.MatchTranslation`:**

**NAB Tags mode:**
- Multiple matches create multiple targets
- Each prefixed with `[NAB: SUGGESTION]`
- Manual selection required (unless `AutoAcceptSuggestions` enabled)

**Target States mode:**
- First match automatically applied
- State set to configured value (if `SetExactMatchToState` set)
- State-qualifier set to `exact-match`
- No manual review needed

## Best Practices

### For NAB Tags Mode

1. **Complete batches** - Translate all tags before committing
2. **Search workflow** - Use `Ctrl+Alt+U` repeatedly
3. **Clean commits** - Don't commit files with tags unless intentional
4. **Document process** - Train team on tag meanings
5. **Regular cleanup** - Verify no tags remain before release

### For Target States Mode

1. **Understand states** - Learn XLIFF state meanings
2. **Use tools** - Consider XLIFF-aware editors
3. **Configure matching** - Set `SetExactMatchToState` appropriately
4. **Review workflow** - Define clear state transitions
5. **External coordination** - Align states with external tools

### General Best Practices

1. **Pick one mode** - Don't switch frequently
2. **Document choice** - Record decision in project docs
3. **Team alignment** - Ensure all translators use same mode
4. **Test workflow** - Validate process with small translation batch
5. **Version control** - Commit XLF files consistently

## Troubleshooting

### Tags and states both present

**Problem:** XLF file has both `[NAB: *]` tags and state attributes

**Solution:**
1. Decide which mode to use
2. Clean up according to chosen mode
3. Run **`NAB: Refresh XLF files from g.xlf`** to normalize

### Can't find translations to review

**Problem:** `Ctrl+Alt+U` doesn't find anything but translations incomplete

**NAB Tags mode:**
- Search manually for `[NAB:`
- Verify tags weren't accidentally removed

**Target States mode:**
- Check state attributes in XML
- Use XLIFF editor to view states
- Verify `UseTargetStates` setting is correct

### External tool doesn't understand NAB Tags

**Problem:** Translation tool confused by `[NAB: *]` tags

**Solution:**
1. Switch to Target States mode
2. Remove all NAB tags from targets
3. Export cleaned files
4. Keep `UseTargetStates: true` for future

## See Also

- [Translation Workflow Guide](../guides/translation-workflow.md) - Complete workflow using either mode
- [XLIFF Tools Reference](xliff-tools.md) - All translation commands
- [Settings Reference](../reference/settings.md) - All configuration options
- [Translation Review Workflow](../guides/translation-review-workflow.md) - Review process guide
