# Getting Started with NAB AL Tools

Quick start guide to begin using NAB AL Tools for Business Central AL development and translation management.

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions view
3. Search for "NAB AL Tools"
4. Click **Install**
5. Reload VS Code when prompted

### From Command Palette

1. Press `Ctrl+P` to open Quick Open
2. Type: `ext install nabsolutions.nab-al-tools`
3. Press Enter
4. Reload VS Code when prompted

### Verify Installation

After installation:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "NAB:"
3. You should see NAB AL Tools commands listed

## Prerequisites

Before using NAB AL Tools, ensure you have:

- **VS Code** - Latest stable version
- **AL Language Extension** - Microsoft's AL extension
- **Business Central AL Project** - An AL workspace with app.json

## Quick Start: Translation Workflow

### 1. Initial Setup

**Enable translations in your AL project:**

1. Ensure your `app.json` has translation support:

```json
{
  "name": "MyApp",
  "publisher": "MyCompany",
  "version": "1.0.0.0",
  "features": ["TranslationFile"]
}
```

2. Create `Translations` folder in project root (if not exists)

### 2. Build Your Application

Generate the g.xlf file:

1. Press `F5` or `Ctrl+Shift+B` to build
2. Verify `Translations/MyApp.g.xlf` is created
3. This file contains all translatable texts from your AL code

### 3. Create Language Files

Add your first translation language:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run **`NAB: Create translation XLF for new language`**
3. Enter language code (e.g., `da-DK` for Danish)
4. Choose "Yes" to match BaseApp translations
5. File created: `Translations/MyApp.da-DK.xlf`

### 4. Translate Texts

Start translating:

1. Open the newly created XLF file
2. Press `Ctrl+Alt+U` to find next untranslated text
3. See `[NAB: NOT TRANSLATED]` or `[NAB: SUGGESTION]` tags
4. Replace tags with translations
5. Press `Ctrl+Alt+U` again to find next
6. Repeat until all translations complete

### 5. Review and Save

Final steps:

1. Run **`NAB: Find untranslated texts`** to verify completion
2. Save all files (`Ctrl+Shift+S`)
3. Commit to source control
4. Build and deploy your app

**Congratulations!** You've completed your first translation workflow with NAB AL Tools.

## Understanding Translation Modes

NAB AL Tools supports two translation modes:

### NAB Tags Mode (Default - Recommended for Beginners)

Uses visible text tags in translations:

- `[NAB: NOT TRANSLATED]` - Needs translation
- `[NAB: REVIEW]` - Needs review
- `[NAB: SUGGESTION]` - Suggested translation

**Best for:**

- Learning the workflow
- Working without external tools
- Direct editing in VS Code

### Target States Mode (Advanced)

Uses XLIFF state attributes:

- `state="new"` - Not translated
- `state="needs-translation"` - Needs translation
- `state="translated"` - Complete

**Best for:**

- External translation tools
- Professional translators
- AI-assisted workflows

**To enable:**

```json
{
  "NAB.UseTargetStates": true
}
```

**See:** [Target States vs NAB Tags](../features/target-states-vs-nab-tags.md) for detailed comparison.

## Essential Commands

### Translation Commands

**`NAB: Refresh XLF files from g.xlf`**

- Updates all language files from g.xlf
- Run after building your application
- Adds new translations, marks changes

**`NAB: Find next untranslated text`** (`Ctrl+Alt+U`)

- Finds next text needing attention
- Use repeatedly to work through translations
- Most-used command in translation workflow

**`NAB: Create translation XLF for new language`**

- Adds support for new language
- Optionally matches BaseApp translations
- Creates ready-to-translate file

### Navigation Commands

**`NAB: Find translated texts of current line`**

- Shows translations of current AL code line
- Useful for checking consistency
- Quick reference during development

**`NAB: Find source of current Translation Unit`** (`F12` in XLF)

- Jumps from translation to AL source code
- Provides context for translation
- Useful during review

## Key Settings

### Enable/Disable Features

```json
{
  // Use XLIFF state attributes instead of NAB tags
  "NAB.UseTargetStates": false,

  // Enable translation matching from previous translations
  "NAB.MatchTranslation": true,

  // Show translations when hovering over AL code
  "NAB.EnableTranslationsOnHover": true,

  // Highlight translation issues in editor
  "NAB.ShowXlfHighlights": true
}
```

### Translation Workflow

```json
{
  // Auto-accept first matched translation (NAB tags mode only)
  "NAB.AutoAcceptSuggestions": false,

  // State to set for exact matches (target states mode)
  "NAB.SetExactMatchToState": "",

  // Clear target when source changes (target states mode)
  "NAB.ClearTargetWhenSourceHasChanged": false
}
```

## Common Workflows

### Daily Development with Translations

1. Write AL code with captions and labels
2. Build application (`F5`)
3. Run **`NAB: Refresh XLF files from g.xlf`**
4. Check for new translations: `Ctrl+Alt+U`
5. Translate if needed
6. Commit changes

### Adding Multiple Languages

1. **First language:**

   - Run **`NAB: Create translation XLF for new language`**
   - Enter first language code (e.g., `da-DK`)
   - Choose BaseApp matching

2. **Additional languages:**

   - Repeat for each language
   - Consider translating from first completed language

3. **Complete translations:**
   - Use `Ctrl+Alt+U` for each language file
   - Leverage glossaries for consistency

### Using AI for Translation

**Prerequisites:**

- GitHub Copilot with chat enabled
- NAB AL Tools extension

**Workflow:**

1. Open any file from your AL app
2. Open GitHub Copilot Chat
3. Run: `/translateXlfFiles`
4. Agent handles complete translation automatically
5. Review results

**See:** [Language Model Tools](../features/language-model-tools.md) for details.

## Tips for Success

### Translation Best Practices

1. **Use glossaries** - Ensure consistent terminology
2. **Translate in context** - Keep AL code open for reference
3. **Preserve placeholders** - Keep %1, %2, %3 in translations
4. **Test in BC** - Verify translations in running application
5. **Version control** - Commit XLF files with code

### Keyboard Shortcuts

- `Ctrl+Alt+U` - Find next untranslated text (most important!)
- `F12` - Find source of translation (in XLF file)
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+F` - Find in file (search for tags)

### Performance Tips

Large translation files can slow VS Code:

1. **Disable hover** if experiencing slowness:

```json
{
  "NAB.EnableTranslationsOnHover": false
}
```

2. **Use XLIFF Editor** for large files:

   - Run **`NAB: Edit Xliff Document`**
   - Visual interface with better performance

3. **Batch operations** - Process translations in smaller batches

## Learning Resources

### Documentation

- **[Translation Workflow Guide](translation-workflow.md)** - Complete workflow explanation
- **[XLIFF Tools Reference](../features/xliff-tools.md)** - All commands and features
- **[Target States vs NAB Tags](../features/target-states-vs-nab-tags.md)** - Mode comparison
- **[Glossary Management](../features/glossary.md)** - Maintaining terminology

### Video Resources

Check the main [README](../../extension/README.md) for animated GIF demonstrations of key features.

### Getting Help

**Issues and Questions:**

- [GitHub Issues](https://github.com/jwikman/nab-al-tools/issues) - Report bugs or request features
- [GitHub Discussions](https://github.com/jwikman/nab-al-tools/discussions) - Ask questions

**Marketplace:**

- [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools) - Rate and review

## Advanced Features

Once comfortable with basics, explore:

### AI-Assisted Translation

- NAB-XLF-Translator agent
- Automated translation workflows
- Quality validation

### External Translation Tools

- Export to CSV for translators
- Import translated CSV files
- Integration with professional tools

### Custom Glossaries

- Create project-specific glossaries
- Override built-in BC glossary
- Ensure consistent terminology

### MCP Server

- Use tools outside VS Code
- Claude Desktop integration
- Programmatic access to translation tools

## Troubleshooting Quick Fixes

### "Cannot find g.xlf file"

**Solution:** Build your AL project (`F5` or `Ctrl+Shift+B`)

### No commands appear

**Solution:**

1. Verify NAB AL Tools is installed
2. Reload VS Code
3. Check you're in AL workspace

### Translations not updating

**Solution:**

1. Clean project: `Ctrl+Shift+P` → "AL: Clean"
2. Delete `objcache` folder
3. Rebuild application

### Hover not working

**Solution:**

1. Verify `NAB.EnableTranslationsOnHover`: `true`
2. Rebuild project
3. Reopen files

**See:** [Common Issues](../troubleshooting/common-issues.md) for more solutions.

## Next Steps

Now that you're set up:

1. **Complete your first translation** using the workflow above
2. **Explore advanced features** as you get comfortable
3. **Customize settings** to match your workflow
4. **Try AI-assisted translation** for faster results
5. **Share with your team** - consistent translation practices

## See Also

- [Translation Workflow Guide](translation-workflow.md) - Detailed workflow
- [Translation Review Workflow](translation-review-workflow.md) - Quality assurance
- [XLIFF Tools Reference](../features/xliff-tools.md) - Complete command reference
- [Settings Reference](../reference/settings.md) - All configuration options
