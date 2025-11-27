# NAB AL Tools MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@nabsolutions/nab-al-tools-mcp)](https://www.npmjs.com/package/@nabsolutions/nab-al-tools-mcp)

An **open source** [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides AI assistants with powerful translation management tools for AL language development and Microsoft Dynamics 365 Business Central extensions.

## Overview

The NAB AL Tools MCP Server exposes XLIFF translation management functionality through the Model Context Protocol, enabling AI assistants like Claude Desktop to help with:

- **Translation Workflow Management** - Refresh XLF files, retrieve untranslated texts, and save translations
- **Translation Discovery** - Search and filter translations by state, keyword, or context
- **Localization Setup** - Create new language files and manage translation projects
- **Terminology Consistency** - Access built-in Business Central glossary terms

## Features

- 🌐 **Complete XLIFF Workflow** - Sync generated XLF files and manage translation states
- 🔍 **Advanced Search** - Find translations by keyword, regex, or translation state
- 📚 **Context-Aware** - Detailed object/property context for accurate translations
- 🎯 **Terminology Support** - Built-in Business Central glossary for consistent translations
- ⚡ **Batch Operations** - Efficient bulk translation updates
- 🛡️ **Type Safety** - Full input validation with detailed error handling

## Installation

### Option 1: Use with npx (Recommended)

No manual installation required! MCP clients can run the server directly using npx, which automatically downloads and runs the latest version.

### Option 2: Manual Installation

Install manually if you:

- Want faster startup times (no download delay)
- Need to work offline
- Prefer having the package locally available
- Are using the server frequently

```bash
# Global installation
npm install -g @nabsolutions/nab-al-tools-mcp

# Local installation (in your project)
npm install @nabsolutions/nab-al-tools-mcp
```

## Quick Start

### GitHub Copilot Coding Agent Configuration

For GitHub Copilot Coding agent, add to your MCP settings:

```json
{
  "mcpServers": {
    "nab-al-tools": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@nabsolutions/nab-al-tools-mcp"]
    }
  }
}
```

### Claude Desktop Configuration

**Option 1: Using npx (no installation required)**

Add the server to your Claude Desktop configuration (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nab-al-tools": {
      "command": "npx",
      "args": ["-y", "@nabsolutions/nab-al-tools-mcp"]
    }
  }
}
```

**Option 2: Using globally installed package**

```json
{
  "mcpServers": {
    "nab-al-tools": {
      "command": "nab-al-tools-mcp"
    }
  }
}
```

### Other MCP Clients

The server implements the standard MCP protocol and works with any MCP-compatible client using stdio transport.

## Available Tools

### Translation Workflow

#### `refreshXlf`

Synchronizes XLF translation files with the latest generated XLF from AL compilation.

```typescript
{
  "generatedXlfFilePath": "/path/to/MyApp.g.xlf",
  "filePath": "/path/to/MyApp.sv-SE.xlf",
  "workspaceFilePath": "/path/to/workspace.code-workspace"
}
```

#### `saveTranslatedTexts`

Saves translated texts to an XLF file with batch support.

```typescript
{
  "filePath": "/path/to/MyApp.sv-SE.xlf",
  "translations": [
    {
      "id": "Table123-Field456-Caption",
      "targetText": "Translated caption",
      "targetState": "translated"
    }
  ]
}
```

### Translation Discovery

#### `getTextsToTranslate`

Retrieves untranslated texts with context and pagination support.

```typescript
{
  "filePath": "/path/to/MyApp.sv-SE.xlf",
  "offset": 0,
  "limit": 50
}
```

#### `getTranslatedTextsByState`

Filters translations by their state (needs-review, translated, final, signed-off).

```typescript
{
  "filePath": "/path/to/MyApp.sv-SE.xlf",
  "translationStateFilter": "needs-review",
  "offset": 0,
  "limit": 25
}
```

#### `getTextsByKeyword`

Searches source or target texts by keyword or regex pattern.

```typescript
{
  "filePath": "/path/to/MyApp.sv-SE.xlf",
  "keyword": "customer",
  "caseSensitive": false,
  "searchInTarget": false,
  "offset": 0,
  "limit": 20
}
```

### Translation Reference

#### `getTranslatedTextsMap`

Gets existing translations grouped by source text for consistency checking.

```typescript
{
  "filePath": "/path/to/MyApp.sv-SE.xlf",
  "offset": 0,
  "limit": 100
}
```

#### `getGlossaryTerms`

Retrieves Business Central terminology for consistent translations. Optionally merges with a local glossary file where local terms take precedence.

```typescript
{
  "targetLanguageCode": "sv-SE",
  "sourceLanguageCode": "en-US",
  "localGlossaryPath": "/path/to/project/local-glossary.tsv"  // Optional
}
```

**Local Glossary Format**: The local glossary file must be a TSV (Tab-Separated Values) file with:

- First column: en-US (source language, typically)
- Last column: Description (optional, can be omitted)
- Columns in between: language codes (e.g., da-DK, sv-SE, etc.)
- First line: ISO language codes as headers

Example:

```tsv
en-US	da-DK	sv-SE	Description
Item	Artikel	Artikel	Our preferred translation
Custom Term	Brugerdefineret	Anpassad term	Project-specific term
```

### Project Setup

#### `createLanguageXlf`

Creates new XLF files for additional languages with optional base app matching.

```typescript
{
  "generatedXlfFilePath": "/path/to/MyApp.g.xlf",
  "targetLanguageCode": "da-DK",
  "matchBaseAppTranslation": true
}
```

## Usage Examples

### Basic Translation Workflow

1. **Refresh translations** after AL compilation:

   ```
   Use refreshXlf with your .g.xlf and target language .xlf files
   ```

2. **Get untranslated texts**:

   ```
   Use getTextsToTranslate to see what needs translation
   ```

3. **Save translations**:
   ```
   Use saveTranslatedTexts to update the XLF file
   ```

### Advanced Scenarios

- **Review workflow**: Use `getTranslatedTextsByState` to find texts needing review
- **Terminology check**: Use `getGlossaryTerms` before translating to ensure consistency. Pass a `localGlossaryPath` to merge project-specific terminology with built-in terms.
- **Bulk updates**: Use `getTextsByKeyword` to find all instances of specific terms
- **New language setup**: Use `createLanguageXlf` to initialize translation files

## Language Support

- **XLF Translation Tools**: Support any Business Central language code (e.g., `sv-SE`, `da-DK`, `de-DE`, `fr-FR`, etc.)
- **Glossary Terms**: Limited to built-in glossary languages:
  - `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-NZ`
  - `da-DK`, `de-DE`, `de-AT`, `de-CH`
  - `es-ES_tradnl`, `es-MX`
  - `fi-FI`, `fr-FR`, `fr-BE`, `fr-CA`, `fr-CH`
  - `it-IT`, `it-CH`
  - `nb-NO`, `nl-NL`, `nl-BE`
  - `sv-SE`, `cs-CZ`, `is-IS`

## Error Handling

The server provides comprehensive error handling with:

- **Input Validation**: Zod schema validation for all parameters
- **File System Errors**: Clear messages for missing files or permission issues
- **XML Parsing**: Graceful handling of malformed XLIFF files
- **MCP Compliance**: Proper error responses with `isError: true`

## Requirements

- Node.js >= 22.0.0
- Valid AL project with XLIFF translation files
- MCP-compatible client (Claude Desktop, etc.)

## Related Projects

- **[NAB AL Tools VS Code Extension](https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools)** - Full-featured translation management for VS Code
- **[NAB Solutions](https://nabsolutions.com/)** - Microsoft Dynamics 365 consulting and development
- **[SmartApps](https://smartappsford365.com/)** - AppSource application provider

## Contributing

This project is open source and welcomes contributions. Visit our [GitHub repository](https://github.com/jwikman/nab-al-tools) to:

- Report issues
- Submit feature requests
- Contribute code improvements

## License

MIT License - see [LICENSE](https://github.com/jwikman/nab-al-tools/blob/main/extension/LICENSE.MD) for details.

## Support

- **Documentation**: [Full MCP Server Documentation](https://github.com/jwikman/nab-al-tools/blob/main/extension/MCP_SERVER.md)
- **Issues**: [GitHub Issues](https://github.com/jwikman/nab-al-tools/issues)
- **VS Code Extension**: [Marketplace](https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools)
