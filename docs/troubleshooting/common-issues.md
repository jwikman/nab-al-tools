# Common Issues and Solutions

Solutions to frequently encountered problems when using NAB AL Tools.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Translation File Issues](#translation-file-issues)
- [Translation Workflow Issues](#translation-workflow-issues)
- [Performance Issues](#performance-issues)
- [Command Issues](#command-issues)
- [Integration Issues](#integration-issues)

## Installation Issues

### Extension not appearing in VS Code

**Symptom:** Cannot find NAB AL Tools in Extensions view

**Solutions:**
1. **Refresh extensions:**
   - Press `Ctrl+Shift+X`
   - Click refresh icon
   - Search again for "NAB AL Tools"

2. **Check marketplace connection:**
   - Verify internet connection
   - Check if behind firewall/proxy
   - Configure proxy settings if needed

3. **Manual installation:**
   - Download .vsix from [marketplace](https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools)
   - Install from VSIX: `Extensions → ... → Install from VSIX`

### Commands not appearing

**Symptom:** NAB commands don't show in Command Palette

**Solutions:**
1. **Verify installation:**
   - Check Extensions view
   - Ensure NAB AL Tools is enabled
   - Reload VS Code

2. **Check workspace:**
   - Ensure you're in an AL workspace
   - Verify app.json exists
   - Open workspace folder, not individual files

3. **Reinstall extension:**
   - Uninstall NAB AL Tools
   - Reload VS Code
   - Reinstall extension
   - Reload VS Code again

## Translation File Issues

### Cannot find g.xlf file

**Symptom:** Error message: "Cannot find g.xlf file"

**Causes:**
- Application not built yet
- Build failed
- Translations folder missing
- Incorrect app name in app.json

**Solutions:**

1. **Build application:**
   ```
   Press F5 or Ctrl+Shift+B
   ```

2. **Verify folder structure:**
   ```
   MyProject/
   ├── app.json
   ├── Translations/
   │   └── MyApp.g.xlf
   ```

3. **Check app.json:**
   ```json
   {
     "name": "MyApp",
     "features": ["TranslationFile"]
   }
   ```
   g.xlf will be named `<name>.g.xlf`

4. **Use Update g.xlf:**
   - Run **`NAB: Update g.xlf`**
   - This can create g.xlf without full build

### Translations not updating after build

**Symptom:** g.xlf doesn't reflect code changes after compilation

**Causes:**
- AL compiler cache
- Build didn't complete
- Changes in non-translatable text

**Solutions:**

1. **Clean and rebuild:**
   ```
   Ctrl+Shift+P → "AL: Clean"
   Delete objcache folder
   Press F5 to rebuild
   ```

2. **Verify changes:**
   - Ensure changes are in translatable properties (Caption, Label, etc.)
   - Check for `Locked = true` (locked texts not translated)

3. **Force update:**
   - Run **`NAB: Update g.xlf`**
   - Then **`NAB: Refresh XLF files from g.xlf`**

### Empty targets after refresh

**Symptom:** Translation targets are blank after running refresh

**Cause:** Bug fixed in v1.45 - empty targets now properly detected

**Solution:**
1. Update to NAB AL Tools v1.45 or later
2. Run **`NAB: Refresh XLF files from g.xlf`**
3. Empty targets will be marked as needing translation

### Translation units not in correct order

**Symptom:** Trans-units in wrong order compared to g.xlf

**Solution:**
- Run **`NAB: Sort XLF files as g.xlf`**
- All language files reordered to match g.xlf

### Locked translations being translated

**Symptom:** Texts marked `Locked = true` appearing in XLF files

**Solution:**
1. **In AL code:** Ensure locked texts have `Locked = true`
   ```al
   Label = 'Fixed Text', Locked = true;
   ```

2. **Clean up existing:**
   - Run **`NAB: Update g.xlf`**
   - Locked texts removed from g.xlf
   - Run **`NAB: Refresh XLF files from g.xlf`**

## Translation Workflow Issues

### Cannot find untranslated texts

**Symptom:** `Ctrl+Alt+U` doesn't find anything but translations incomplete

**NAB Tags Mode Solutions:**

1. **Search manually:**
   - Press `Ctrl+F`
   - Search for `[NAB:`
   - Verify tags not accidentally removed

2. **Verify mode:**
   ```json
   {
     "NAB.UseTargetStates": false
   }
   ```

3. **Re-run refresh:**
   - Run **`NAB: Refresh XLF files from g.xlf`**
   - Tags will be re-added

**Target States Mode Solutions:**

1. **Check state attributes:**
   - Open XLF in text editor
   - Look for `state="needs-translation"` etc.

2. **Verify mode:**
   ```json
   {
     "NAB.UseTargetStates": true
   }
   ```

3. **Use XLIFF editor:**
   - Run **`NAB: Edit Xliff Document`**
   - Filter by state
   - Visual view of states

### Multiple targets appearing

**Symptom:** Trans-units have multiple `<target>` elements

**Cause:** Translation matching found multiple different translations

**Solution:**

1. **Find all occurrences:**
   - Run **`NAB: Find multiple targets in XLF files`**

2. **Review each case:**
   ```xml
   <!-- Before -->
   <trans-unit id="123">
     <source>Customer</source>
     <target>[NAB: SUGGESTION] Kunde</target>
     <target>[NAB: SUGGESTION] Debitor</target>
   </trans-unit>
   
   <!-- After - keep correct one -->
   <trans-unit id="123">
     <source>Customer</source>
     <target>Kunde</target>
   </trans-unit>
   ```

3. **Choose correct translation:**
   - Check glossary
   - Check BC standard
   - Remove extra targets

### Tags and states both present

**Symptom:** XLF has both `[NAB: *]` tags and state attributes

**Cause:** Switched modes without cleanup

**Solution:**

1. **Decide which mode:**
   - Choose NAB tags or target states
   - Set `NAB.UseTargetStates` accordingly

2. **Clean up:**
   - If using NAB tags: Remove state attributes (optional)
   - If using target states: Remove `[NAB: *]` tags
   
3. **Normalize:**
   - Run **`NAB: Refresh XLF files from g.xlf`**
   - Mode-specific markers applied

### Placeholders missing or wrong

**Symptom:** Translations missing %1, %2, etc.

**Cause:** Translator removed or misplaced placeholders

**Solution:**

1. **Manual fix:**
   ```xml
   <!-- Wrong -->
   <source>Post %1 %2 entries</source>
   <target>Bogfør poster</target>
   
   <!-- Fixed -->
   <source>Post %1 %2 entries</source>
   <target>Bogfør %1 %2 poster</target>
   ```

2. **Use detection:**
   - Enable `NAB.DetectInvalidTargets`: `true`
   - Invalid placeholders highlighted

3. **Review process:**
   - Implement review checklist
   - Verify placeholder preservation
   - Test in running application

### Translation comments not working

**Symptom:** Translations in AL comments not applied

**Solutions:**

1. **Verify setting:**
   ```json
   {
     "NAB.LanguageCodesInComments": ["da-DK", "sv-SE"]
   }
   ```

2. **Check format:**
   ```al
   // Correct format:
   Caption = 'Customer'; // da-DK='Kunde', sv-SE='Kund'
   
   // Wrong format (missing quotes):
   Caption = 'Customer'; // da-DK=Kunde
   ```

3. **Run refresh:**
   - Save AL file
   - Run **`NAB: Refresh XLF files from g.xlf`**
   - Comments applied to XLF

## Performance Issues

### VS Code slow when editing AL code

**Symptom:** Lag when typing in AL files

**Cause:** Translation hover feature with large XLF files

**Solution:**

1. **Disable hover:**
   ```json
   {
     "NAB.EnableTranslationsOnHover": false
   }
   ```

2. **Reduce XLF size:**
   - Split into smaller apps if possible
   - Remove unnecessary translation units

3. **Increase resources:**
   - Close other VS Code windows
   - Close other applications
   - Restart VS Code

### Refresh XLF command takes too long

**Symptom:** Refresh command runs for several minutes

**Causes:**
- Very large translation files
- Many language files
- Translation matching enabled with many sources

**Solutions:**

1. **Disable matching temporarily:**
   ```json
   {
     "NAB.MatchTranslation": false
   }
   ```
   Run refresh, then re-enable

2. **Reduce suggestion paths:**
   ```json
   {
     "NAB.TranslationSuggestionPaths": []
   }
   ```

3. **Process languages individually:**
   - Temporarily remove some language files
   - Process remaining files
   - Add back and process

### XLIFF Editor slow to open

**Symptom:** Visual editor takes long time to load

**Cause:** Large XLF file

**Solutions:**
- Edit raw XML instead
- Split translations into smaller files
- Use filter in XLIFF editor to show subset

## Command Issues

### Command does nothing

**Symptom:** Running command has no visible effect

**Solutions:**

1. **Check Output panel:**
   - `View → Output`
   - Select "NAB AL Tools" from dropdown
   - View error messages

2. **Verify file open:**
   - Some commands require specific file open
   - e.g., "Copy source to target" needs XLF open

3. **Check workspace:**
   - Ensure AL workspace loaded
   - Verify app.json exists

### Export to CSV fails

**Symptom:** CSV export command fails or creates empty file

**Solutions:**

1. **Open XLF file first:**
   - Commands work on active file
   - Open XLF before exporting

2. **Check file permissions:**
   - Verify write access to target folder
   - Try different location

3. **Check XLF validity:**
   - Ensure XLF is valid XML
   - Fix any XML errors first

### Import from CSV fails

**Symptom:** CSV import doesn't update translations

**Solutions:**

1. **Verify CSV format:**
   - Check column headers match
   - Verify IDs match XLF file
   - Ensure proper encoding (UTF-8)

2. **Check settings:**
   ```json
   {
     // Ignore missing units
     "NAB.ignoreMissingTransUnitsOnImport": true,
     
     // Allow different source
     "NAB.importTranslationWithDifferentSource": true
   }
   ```

3. **Review Output:**
   - Check NAB AL Tools output panel
   - Review which updates succeeded/failed

## Integration Issues

### BaseApp matching not working

**Symptom:** No suggestions from BaseApp translations

**Solutions:**

1. **Download BaseApp:**
   - Run **`NAB: Download Base App Translation files`**
   - Wait for download to complete
   - Try matching again

2. **Verify setting:**
   ```json
   {
     "NAB.MatchTranslation": true
   }
   ```

3. **Check language support:**
   - BaseApp available for common BC languages
   - Verify your language is supported

### External translation tool doesn't understand files

**Symptom:** Translation tool errors when opening XLF

**Solutions:**

1. **Enable target states:**
   ```json
   {
     "NAB.UseTargetStates": true
   }
   ```

2. **Check 'original' attribute:**
   ```json
   {
     "NAB.PreserveOriginalAttribute": true
   }
   ```
   Some tools (like Crowdin) require matching 'original' attributes

3. **Remove NAB tags:**
   - Clean all `[NAB: *]` tags before export
   - Use target states mode instead

### AI translation not working

**Symptom:** `/translateXlfFiles` command fails

**Prerequisites check:**

1. **GitHub Copilot:**
   - Verify Copilot subscription active
   - Check Copilot chat enabled
   - Reload VS Code

2. **File context:**
   - Open file from AL application
   - Ensure app.json in workspace

3. **Extension version:**
   - Update NAB AL Tools to latest
   - Check for compatibility

### MCP server not starting

**Symptom:** MCP server fails to start

**Solutions:**

1. **Check installation:**
   ```bash
   npm install -g @nabsolutions/nab-al-tools-mcp
   ```

2. **Verify configuration:**
   - Check MCP client config
   - Ensure correct server path
   - Verify workspace settings

3. **Check logs:**
   - Review server startup logs
   - Check for error messages

**See:** [MCP Server Setup](../guides/mcp-server-setup.md)

## General Troubleshooting Steps

When encountering any issue:

1. **Check Output panel:**
   - `View → Output`
   - Select "NAB AL Tools"
   - Read error messages

2. **Reload VS Code:**
   - `Ctrl+Shift+P` → "Developer: Reload Window"
   - Sometimes fixes transient issues

3. **Update extension:**
   - Check for updates in Extensions view
   - Update to latest version
   - Reload VS Code

4. **Check workspace:**
   - Verify app.json exists
   - Ensure valid AL workspace
   - Check folder permissions

5. **Review settings:**
   - Check NAB.* settings
   - Verify no conflicting settings
   - Reset to defaults if needed

6. **Search existing issues:**
   - [GitHub Issues](https://github.com/jwikman/nab-al-tools/issues)
   - Someone may have encountered same problem

7. **Report bug:**
   - If issue persists, report on GitHub
   - Include error messages
   - Provide reproduction steps

## Getting Additional Help

If your issue isn't covered here:

### Documentation
- [Translation Workflow Guide](../guides/translation-workflow.md)
- [XLIFF Tools Reference](../features/xliff-tools.md)
- [Settings Reference](../reference/settings.md)

### Community
- [GitHub Issues](https://github.com/jwikman/nab-al-tools/issues) - Report bugs
- [GitHub Discussions](https://github.com/jwikman/nab-al-tools/discussions) - Ask questions

### Reporting Issues

When reporting a bug, include:
1. **Extension version:** Check in Extensions view
2. **VS Code version:** `Help → About`
3. **Error message:** From Output panel
4. **Steps to reproduce:** Clear, step-by-step
5. **Expected behavior:** What should happen
6. **Actual behavior:** What actually happened
7. **Screenshots:** If relevant

**Report at:** [github.com/jwikman/nab-al-tools/issues](https://github.com/jwikman/nab-al-tools/issues)

---

## See Also

- [Getting Started](../guides/getting-started.md)
- [Translation Workflow](../guides/translation-workflow.md)
- [XLIFF Tools Reference](../features/xliff-tools.md)
- [Settings Reference](../reference/settings.md)
