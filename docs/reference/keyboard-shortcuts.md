# Keyboard Shortcuts Reference

Quick reference for all keyboard shortcuts in NAB AL Tools.

## Default Shortcuts

These shortcuts are configured by default in NAB AL Tools:

### Translation Workflow

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Ctrl+Alt+U` | **NAB: Find next untranslated text** | Navigate to next translation needing attention |
| `F12` | **NAB: Find source of current Translation Unit** | Jump from XLF translation to AL source code (when in XLF file) |

### General Navigation

Standard VS Code shortcuts that work with NAB AL Tools:

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Ctrl+Shift+P` | Command Palette | Access all NAB commands |
| `Ctrl+P` | Quick Open | Open files quickly |
| `Ctrl+F` | Find | Search in current file (useful for finding `[NAB:` tags) |
| `Ctrl+H` | Replace | Find and replace in current file |
| `Ctrl+Shift+F` | Find in Files | Search across workspace |
| `Ctrl+Shift+H` | Replace in Files | Find and replace across workspace |
| `Ctrl+S` | Save | Save current file |
| `Ctrl+Shift+S` | Save All | Save all open files |

### Editing

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Ctrl+/` | Toggle Line Comment | Comment/uncomment line |
| `Ctrl+D` | Add Selection to Next Find Match | Select next occurrence of current word |
| `Alt+Click` | Add Cursor | Add multiple cursors |
| `Ctrl+Space` | Trigger Suggest | Show IntelliSense suggestions |

### Building and Debugging

| Shortcut | Command | Description |
|----------|---------|-------------|
| `F5` | Start Debugging | Build and run AL application (generates g.xlf) |
| `Ctrl+Shift+B` | Build | Compile AL application |
| `Ctrl+F5` | Run Without Debugging | Run AL application without debugger |

## Custom Shortcuts

You can customize shortcuts to better fit your workflow.

### Adding Custom Shortcuts

1. Open Keyboard Shortcuts: `Ctrl+K Ctrl+S` or `File → Preferences → Keyboard Shortcuts`
2. Search for "NAB:" to find NAB AL Tools commands
3. Click pencil icon next to command
4. Press your desired key combination
5. Press Enter to save

### Recommended Custom Shortcuts

Consider adding these shortcuts for frequently used commands:

| Suggested Shortcut | Command | Reason |
|-------------------|---------|--------|
| `Ctrl+Alt+R` | **NAB: Refresh XLF files from g.xlf** | Most used command after build |
| `Ctrl+Alt+F` | **NAB: Find untranslated texts** | Quick workspace search |
| `Ctrl+Alt+T` | **NAB: Find translated texts of current line** | Quick translation lookup |
| `Ctrl+Alt+G` | **NAB: Update g.xlf** | Quick g.xlf update |
| `Ctrl+Alt+A` | **NAB: Update all XLF files** | Update everything at once |

### Custom Shortcut Configuration

To add custom shortcuts via `keybindings.json`:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Preferences: Open Keyboard Shortcuts (JSON)"
3. Add your custom keybindings:

```json
[
  {
    "key": "ctrl+alt+r",
    "command": "nab.RefreshXlfFilesFromGXlf",
    "when": "editorLangId == al || resourceLangId == xlf"
  },
  {
    "key": "ctrl+alt+f",
    "command": "nab.FindUntranslatedTexts"
  },
  {
    "key": "ctrl+alt+t",
    "command": "nab.FindTranslatedTextsOfCurrentLine",
    "when": "editorLangId == al"
  },
  {
    "key": "ctrl+alt+g",
    "command": "nab.UpdateGXlf"
  },
  {
    "key": "ctrl+alt+a",
    "command": "nab.UpdateAllXlfFiles"
  }
]
```

## Context-Specific Shortcuts

Some shortcuts only work in specific contexts:

### In AL Files

| Shortcut | Command | Availability |
|----------|---------|--------------|
| `Ctrl+Alt+T` (custom) | **NAB: Find translated texts of current line** | AL files only |

### In XLF Files

| Shortcut | Command | Availability |
|----------|---------|--------------|
| `F12` | **NAB: Find source of current Translation Unit** | XLF files only |
| `Ctrl+Alt+U` | **NAB: Find next untranslated text** | XLF files |

### In Any File

| Shortcut | Command | Availability |
|----------|---------|--------------|
| `Ctrl+Shift+P` | Command Palette | Always available |

## Quick Access Patterns

### Efficient Translation Workflow

Use this keyboard sequence for maximum efficiency:

1. **After building:** `Ctrl+Alt+R` (custom: Refresh XLF)
2. **Open XLF file:** `Ctrl+P` → type filename → Enter
3. **Find first untranslated:** `Ctrl+Alt+U`
4. **Translate text** → type translation
5. **Next untranslated:** `Ctrl+Alt+U`
6. **Repeat 4-5** until done
7. **Save:** `Ctrl+S`

### Quick Translation Lookup

When working in AL code and need to check translations:

1. **Position cursor** on text (Caption, Label, etc.)
2. **Lookup translations:** `Ctrl+Alt+T` (custom)
3. **View all translations** in search results or opened XLF

### Fast Navigation Between Files

Switch between AL source and translations:

1. **In AL file:** `Ctrl+Alt+T` → opens XLF at translation
2. **In XLF file:** `F12` → opens AL source
3. **Between files:** `Ctrl+Tab` → cycle open files

## Command Palette Shortcuts

Some commands are best accessed via Command Palette (`Ctrl+Shift+P`):

### Frequently Used Commands

Quick typing shortcuts in Command Palette:

| Type | Command |
|------|---------|
| `nab ref` | NAB: Refresh XLF files from g.xlf |
| `nab find u` | NAB: Find next untranslated text |
| `nab upd` | NAB: Update all XLF files |
| `nab cre` | NAB: Create translation XLF for new language |
| `nab match` | NAB: Match Translations From Base Application |
| `nab sort` | NAB: Sort XLF files as g.xlf |
| `nab exp` | NAB: Export Translations to .csv |
| `nab imp` | NAB: Import Translations from .csv |

### Less Frequent Commands

| Type | Command |
|------|---------|
| `nab edit` | NAB: Edit Xliff Document |
| `nab copy s` | NAB: Copy source to target |
| `nab copy a` | NAB: Copy all source to untranslated target |
| `nab down` | NAB: Download Base App Translation files |
| `nab mul` | NAB: Find multiple targets in XLF files |
| `nab ext` | NAB: Create XLF with selected Source Language |
| `nab by id` | NAB: Import Translations by Id |

## Tips for Keyboard Efficiency

### Muscle Memory

Build muscle memory for these key sequences:

1. **After code change:**
   - `Ctrl+S` → Save
   - `F5` → Build
   - `Ctrl+Alt+R` → Refresh XLF
   - `Ctrl+P` → Open XLF
   - `Ctrl+Alt+U` → Start translating

2. **During translation:**
   - `Ctrl+Alt+U` → Next
   - Type translation
   - `Ctrl+Alt+U` → Next
   - (Repeat)

3. **Checking translations:**
   - Position cursor in AL code
   - `Ctrl+Alt+T` → View translations
   - Review and return

### Multi-Cursor Editing

Use multi-cursor for batch operations:

1. Select text (e.g., `[NAB: SUGGESTION]`)
2. `Ctrl+D` repeatedly to select more occurrences
3. Delete or modify all at once

**Use case:** Batch accepting suggestions by deleting all `[NAB: SUGGESTION]` prefixes.

### Search and Replace

Quick patterns for common replacements:

**Remove all NAB tags:**
1. `Ctrl+H` for Replace
2. Find: `\[NAB: [^\]]+\] ?` (with regex enabled)
3. Replace: (empty)
4. Replace All

**Convert between modes:**
- Useful when switching from NAB tags to target states
- Carefully craft regex to preserve translations
- Test on copy first

## Accessibility

### Alternative Navigation

If keyboard shortcuts conflict:

1. **Use Command Palette:** `Ctrl+Shift+P`
   - Type command name
   - Select from list

2. **Use Mouse/Touch:**
   - Right-click for context menus
   - Use menu bar commands

3. **Customize Shortcuts:**
   - Change conflicting shortcuts
   - Choose combinations that work for you

### Screen Reader Support

NAB AL Tools works with VS Code's screen reader support:

- Enable screen reader: `Ctrl+E`
- Navigation announcements work with standard VS Code screen reader
- Command descriptions read by screen reader in Command Palette

## Platform Differences

### macOS

Replace `Ctrl` with `Cmd` for most shortcuts:

| Windows/Linux | macOS | Command |
|---------------|-------|---------|
| `Ctrl+Alt+U` | `Cmd+Option+U` | Find next untranslated text |
| `Ctrl+Shift+P` | `Cmd+Shift+P` | Command Palette |
| `Ctrl+S` | `Cmd+S` | Save |
| `Ctrl+F` | `Cmd+F` | Find |

### Custom Platform Shortcuts

Configure platform-specific shortcuts in `keybindings.json`:

```json
[
  {
    "key": "ctrl+alt+r",
    "mac": "cmd+alt+r",
    "command": "nab.RefreshXlfFilesFromGXlf"
  }
]
```

## Shortcut Conflicts

### Resolving Conflicts

If NAB AL Tools shortcuts conflict with other extensions:

1. **Check conflicting extension:**
   - Open Keyboard Shortcuts (`Ctrl+K Ctrl+S`)
   - Search for shortcut
   - See which commands use it

2. **Reassign shortcuts:**
   - Remove from less-used command
   - Assign new shortcut to more-used command

3. **Use when clauses:**
   - Configure shortcuts to only work in specific contexts
   - Example: Only in XLF files

### Common Conflicts

`Ctrl+Alt+U` might conflict with:
- Character map (Windows)
- Language input methods
- Other VS Code extensions

**Solutions:**
- Disable conflicting feature if not needed
- Reassign NAB AL Tools shortcut
- Use Command Palette instead

## Quick Reference Card

Print this quick reference for your desk:

```
NAB AL Tools - Essential Shortcuts
===================================

Translation Workflow:
  Ctrl+Alt+U    Find next untranslated text
  F12 (in XLF)  Find source code
  
Build & Refresh:
  F5            Build application (creates g.xlf)
  Ctrl+Alt+R*   Refresh XLF files
  
Navigation:
  Ctrl+Shift+P  Command Palette (access all commands)
  Ctrl+P        Quick Open (open files)
  Ctrl+Tab      Switch between open files
  
Editing:
  Ctrl+F        Find in file
  Ctrl+H        Find and replace
  Ctrl+S        Save file
  
* Custom shortcut (not default)

For full command list: Ctrl+Shift+P → "NAB:"
```

## See Also

- [Getting Started](../guides/getting-started.md) - Initial setup and first workflow
- [Translation Workflow](../guides/translation-workflow.md) - Complete translation process
- [XLIFF Tools Reference](../features/xliff-tools.md) - All commands detailed
- [Commands Reference](commands.md) - Complete command list
