# NAB AL Tools MCP Server

## Overview

The NAB AL Tools MCP (Model Context Protocol) Server provides access to XLIFF translation management functionality for AL language development and Microsoft Dynamics 365 Business Central extensions. This server implements the same core translation tools as the VS Code extension's ChatTools, but in a standalone, command-line accessible format.

## Recent Updates - MCP Compliance & Best Practices

The MCP server has been updated to fully comply with the latest MCP best practices and documentation standards:

### Tool Annotations

All tools now include proper annotations following MCP specification:

- **Tool Annotations**: Each tool includes hints about behavior (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`)
- **Human-Readable Titles**: Clear, descriptive titles for UI display
- **Detailed Input Schemas**: Comprehensive parameter descriptions with validation rules
- **Error Handling**: Proper MCP error reporting with `isError: true` and detailed error messages

### Validation & Type Safety

- **Zod Schema Validation**: All inputs are validated using detailed Zod schemas with parameter limits
- **Type Safety**: Proper TypeScript interfaces ensure parameter consistency
- **Error Classification**: Distinguishes between validation errors and operational errors

### Architecture Improvements

- **Shared Core**: Uses the same `XliffToolsCore.ts` as VS Code extension for consistency
- **Settings Integration**: Properly loads AL project settings via `CliSettingsLoader`
- **VS Code Independent**: Core logic is completely independent of VS Code APIs

## Installation

The MCP server is bundled with the NAB AL Tools VS Code extension and can be run as a standalone Node.js application.

## Available Tools

### 1. refreshXlf

**Purpose**: Refresh and synchronize a XLF language file using the generated XLF file

**Annotations**:

- `readOnlyHint`: false (modifies files)
- `destructiveHint`: false (preserves existing translations)
- `idempotentHint`: true (same result when run multiple times)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `generatedXlfFilePath` (required): Path to the generated XLF file (\*.g.xlf) created by AL compilation
- `filePath` (required): Path to the target XLF file to be refreshed/synchronized
- `workspaceFilePath` (optional): Path to workspace file for additional context and settings

**Example**:

```json
{
  "generatedXlfFilePath": "d:/project/app/Translations//MyApp.g.xlf",
  "filePath": "d:/project/app//Translations/MyApp.da-DK.xlf",
  "workspaceFilePath": "d:/project/app.code-workspace"
}
```

### 2. getTextsToTranslate

**Purpose**: Retrieve untranslated texts from a specified XLF file

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file to retrieve untranslated texts from
- `offset` (required): Starting position for pagination (0-based index, min: 0)
- `limit` (required): Maximum number of texts to retrieve (min: 1)
- `sourceLanguageFilePath` (optional): Path to source language XLF file for reference

**Returns**: JSON array of objects containing:

- `id`: Unique identifier
- `source`: Source text to be translated
- `sourceLanguage`: Source language code
- `type`: Context description (e.g., "Table Customer - Field Name - Property Caption")
- `maxLength`: Character limit (if applicable)
- `comments`: Contextual comments explaining placeholders

### 3. getTranslatedTextsMap

**Purpose**: Get previously translated texts as a translation map grouped by source text

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file to retrieve translated texts map from
- `offset` (required): Starting position for pagination (0-based index, min: 0)
- `limit` (required): Maximum number of translation groups to retrieve (min: 1)
- `sourceLanguageFilePath` (optional): Path to source language XLF file for reference

**Returns**: JSON array of translation objects:

- `sourceText`: The original text
- `targetTexts`: Array of translated versions
- `sourceLanguage`: Source language code

### 4. getTranslatedTextsByState

**Purpose**: Get translated texts filtered by their translation state

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file to retrieve translated texts from
- `offset` (required): Starting position for pagination (0-based index, min: 0)
- `limit` (required): Maximum number of texts to retrieve (min: 1)
- `translationStateFilter` (optional): Filter by state ("needs-review", "translated", "final", "signed-off")
- `sourceText` (optional): Filter to find translations containing this source text
- `sourceLanguageFilePath` (optional): Path to source language XLF file for reference

**Returns**: JSON array of objects containing:

- `id`: Unique identifier
- `source`: Source text
- `target`: Translated text
- `state`: Translation state
- `reviewReason`: Review reason (if available)
- `type`: Context description
- `maxLength`: Character limit (if applicable)
- `comments`: Contextual comments

### 5. saveTranslatedTexts

**Purpose**: Save translated texts to a specified XLF file

**Annotations**:

- `readOnlyHint`: false (modifies files)
- `destructiveHint`: false (updates existing translations)
- `idempotentHint`: false (each call may have different effects)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file where translations will be saved
- `translations` (required): Array of translation objects (min: 1)
  - `id`: Unique identifier of the translation unit to update
  - `targetText`: The translated text to save
  - `targetState` (optional): State to set ("needs-review-translation", "translated", "final", "signed-off")
- `workspaceFilePath` (optional): Path to workspace file for additional context and settings

### 6. createLanguageXlf

**Purpose**: Create a new XLF file for a specified target language based on a generated XLF file

**Annotations**:

- `readOnlyHint`: false (creates new files)
- `destructiveHint`: true (may update existing XLF files during base app matching)
- `idempotentHint`: false (each call creates a new file)
- `openWorldHint`: true (downloads base app translations from internet if matching is enabled)

**Parameters**:

- `generatedXlfFilePath` (required): Path to the generated XLF file (\*.g.xlf) created by AL compilation
- `targetLanguageCode` (required): Language code for the new XLF file (e.g., 'sv-SE', 'da-DK', 'de-DE')
- `matchBaseAppTranslation` (optional): Whether to match translations from the base app (default: false). When enabled, requires an internet connection to fetch translations from Microsoft's servers. (Add "https://nabaltools.file.core.windows.net/shared/base_app_lang_files" to your custom allowlist if you need this feature for the GitHub Copilot Coding Agent)

**Returns**: JSON object containing:

- `numberOfMatches`: Number of translations matched from base app (if enabled)
- `targetXlfFilepath`: Path to the newly created XLF file

**Example**:

```json
{
  "generatedXlfFilePath": "d:/project/app/Translations/MyApp.g.xlf",
  "targetLanguageCode": "sv-SE",
  "matchBaseAppTranslation": false
}
```

### 7. getTextsByKeyword

**Purpose**: Search source or target texts in an XLF file for a given keyword or regular expression and return matching translation units. By default, this tool searches the `<source>` element and includes untranslated units. When `searchInTarget` is true, it searches only the `<target>` element and excludes untranslated units. This tool can be used to discover how a specific word or phrase is used across the application and to inspect how that word or phrase has been translated in different contexts, which helps when reviewing terminology, ensuring consistency, or preparing glossary entries.

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file to search in
- `offset` (required): Starting position for pagination (0-based index, min: 0)
- `limit` (required): Maximum number of texts to retrieve (min: 0). Use `0` to return all matches.
- `keyword` (required): The keyword or phrase to search for. When `isRegex` is true this is treated as a regular expression.
- `caseSensitive` (optional): Enable case-sensitive matching (default: false)
- `isRegex` (optional): Treat `keyword` as a regular expression (default: false)
- `searchInTarget` (optional): Search in target text instead of source text (default: false). When true, only translated units with matching target text are returned.

**Returns**: JSON array of objects containing:

- `id`: Unique identifier
- `sourceText`: Source text
- `sourceLanguage`: Source language code
- `targetText`: Translated text (may be empty for untranslated units)
- `translationState`: Translation state (if available)
- `reviewReason`: Review reason (if available)
- `type`: Context description
- `maxLength`: Character limit (if applicable)
- `comment`: Contextual comments

**Example**:

```json
{
  "filePath": "d:/project/app/Translations/MyApp.sv-SE.xlf",
  "offset": 0,
  "limit": 0,
  "keyword": "This is a test",
  "caseSensitive": false,
  "isRegex": false
}
```

### 8. getGlossaryTerms

**Purpose**: Return glossary terminology pairs for a target language (and optional source language, default en-US) from the built-in Business Central glossary. Useful to enforce consistent terminology during translation, suggestion generation, and review.

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with built-in glossary; no external access)

**Parameters**:

- `targetLanguageCode` (required): Target language code to return terms for (BC language codes, e.g., `en-us`, `en-gb`, `da-dk`, `de-de`, `es-es_tradnl`, `es-mx`, `fi-fi`, `fr-fr`, `it-it`, `nb-no`, `nl-nl`, `sv-se`).
- `sourceLanguageCode` (optional): Source language code to use as the source column (default `en-us`).

**Returns**: JSON array of glossary entries:

- `source`: Source term
- `target`: Target term
- `description`: Short description or note about the term (when available)

**Example**:

```json
{
  "targetLanguageCode": "sv-se",
  "sourceLanguageCode": "en-us"
}
```

## Usage

### Command Line

```bash
# Start the MCP server
node dist/mcp/server.js

# Or, if in development
node src/mcp/server.ts
```

### MCP Client Integration

The server implements the standard MCP protocol and can be integrated with any MCP-compatible client. Configure your MCP client to connect to this server using stdio transport.

Example Claude Desktop configuration:

```json
{
  "mcpServers": {
    "nab-al-tools-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["c:/path/to/nab-al-tools/extension/dist/mcp/server.js"]
    }
  }
}
```

### VS Code Integration

The server is not enabled automatically in VS Code, since the same set of tools are already available. But the MCP Server _can_ be configured manually if needed.

## Error Handling

The server implements comprehensive error handling following MCP best practices:

### Input Validation Errors

- **Zod Schema Validation**: Parameter type and constraint validation
- **File Path Validation**: Ensures XLF files exist and are accessible
- **Parameter Range Validation**: Enforces min/max limits for pagination parameters

### Operational Errors

- **File System Errors**: Handles missing files, permission issues
- **XML Parsing Errors**: Graceful handling of malformed XLIFF files
- **Translation Unit Errors**: Clear error messages for invalid translation IDs

### Error Response Format

All errors are returned with:

- `isError: true`
- Detailed error messages in the `content` array
- Error type classification (validation vs operational)

## Performance Considerations

- **Pagination**: All list operations support offset/limit for large datasets
- **Batch Operations**: saveTranslatedTexts supports up to 100 translations per call
- **File Caching**: Efficient XLIFF file parsing and caching
- **Memory Management**: Proper cleanup of large XML documents

## Security

- **Input Sanitization**: All file paths and parameters are validated
- **File System Access**: Limited to specified project directories
- **No External Access**: Server operates only on local files (openWorldHint: false)

## Troubleshooting

### Common Issues

1. **File Not Found Errors**

   - Ensure XLF file paths are absolute and accessible
   - Verify the Translations folder structure is correct

2. **Invalid Translation Unit ID**

   - Check that the ID exists in the target XLF file
   - Ensure the XLF file is not corrupted

3. **Permission Errors**
   - Verify write permissions for target XLF files
   - Ensure no other processes are locking the files

### Logs

The server logs to stderr for debugging while keeping stdout clean for MCP communication.

## Dependencies

- Node.js >= 14.0.0
- @modelcontextprotocol/sdk
- zod (for input validation)
- Standard AL Tools dependencies (xml2js, etc.)

## Version Compatibility

This MCP server is compatible with:

- MCP Specification v1.0+
- AL Language Extensions
- Business Central development environments

---

For more information about the NAB AL Tools extension, visit the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools).
