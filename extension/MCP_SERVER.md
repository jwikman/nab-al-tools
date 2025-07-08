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

### 1. nab-al-tools-refreshXlf

**Purpose**: Refresh and synchronize a XLF language file using the generated XLF file

**Annotations**:

- `readOnlyHint`: false (modifies files)
- `destructiveHint`: false (preserves existing translations)
- `idempotentHint`: true (same result when run multiple times)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `generatedXlfFilePath` (required): Path to the generated XLF file (\*.g.xlf) created by AL compilation
- `filePath` (required): Path to the target XLF file to be refreshed/synchronized
- `workspaceFilePath` (optional): Path to workspace file for additional context

**Example**:

```json
{
  "generatedXlfFilePath": "d:/project/app/Translations//MyApp.g.xlf",
  "filePath": "d:/project/app//Translations/MyApp.da-DK.xlf",
  "workspaceFilePath": "d:/project/app.code-workspace"
}
```

### 2. nab-al-tools-getTextsToTranslate

**Purpose**: Retrieve untranslated texts from a specified XLF file

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file to retrieve untranslated texts from
- `offset` (required): Starting position for pagination (0-based index, min: 0)
- `limit` (required): Maximum number of texts to retrieve (min: 1)
- `sourceLanguageFilePath` (optional): Path to source language XLF file for reference
- `workspaceFilePath` (optional): Path to workspace file for additional context

**Returns**: JSON array of objects containing:

- `id`: Unique identifier
- `source`: Source text to be translated
- `sourceLanguage`: Source language code
- `type`: Context description (e.g., "Table Customer - Field Name - Property Caption")
- `maxLength`: Character limit (if applicable)
- `comments`: Contextual comments explaining placeholders

### 3. nab-al-tools-getTranslatedTextsMap

**Purpose**: Get previously translated texts as a translation map grouped by source text

**Annotations**:

- `readOnlyHint`: true (read-only operation)
- `openWorldHint`: false (works with local files only)

**Parameters**:

- `filePath` (required): Path to the XLF file to retrieve translated texts map from
- `offset` (required): Starting position for pagination (0-based index, min: 0)
- `limit` (required): Maximum number of translation groups to retrieve (min: 1)
- `sourceLanguageFilePath` (optional): Path to source language XLF file for reference
- `workspaceFilePath` (optional): Path to workspace file for additional context

**Returns**: JSON array of translation objects:

- `sourceText`: The original text
- `targetTexts`: Array of translated versions
- `sourceLanguage`: Source language code

### 4. nab-al-tools-getTranslatedTextsByState

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
- `workspaceFilePath` (optional): Path to workspace file for additional context

**Returns**: JSON array of objects containing:

- `id`: Unique identifier
- `source`: Source text
- `target`: Translated text
- `state`: Translation state
- `reviewReason`: Review reason (if available)
- `type`: Context description
- `maxLength`: Character limit (if applicable)
- `comments`: Contextual comments

### 5. nab-al-tools-saveTranslatedTexts

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
- `workspaceFilePath` (optional): Path to workspace file for additional context

## Available Prompts

The NAB AL Tools MCP Server provides predefined prompts that guide users through common translation workflows. These prompts can be discovered and used by MCP clients to provide structured translation assistance.

### 1. translate-app

**Purpose**: Complete workflow to translate all XLF files in an AL application to a target language

**Description**: This prompt guides users through the comprehensive process of finding untranslated texts, translating them using AI, and saving the translations back to the XLF files. It provides a step-by-step workflow that leverages all the available MCP tools with explicit support for looping through all XLF files for a given language.

**Arguments**:

- `appFolderPath` (required): Path to the AL application folder containing the Translations subfolder
- `targetLanguage` (required): Target language code (e.g., 'da-DK', 'de-DE', 'fr-FR')
- `sourceLanguage` (optional): Source language code for reference (e.g., 'en-US'). Defaults to 'en-US' if not specified
- `batchSize` (optional): Number of texts to translate in each batch (default: 20, max: 100)

**Workflow Steps**:

1. **Discover XLF Files**: Identify all XLF files in the Translations folder that need translation to the target language
2. **Initialize Translation**: Check if target language XLF file exists and assess untranslated texts
3. **Process in Batches**: Retrieve untranslated texts in manageable batches using `nab-al-tools-getTextsToTranslate`
4. **AI Translation**: Analyze context (AL object types, character limits, placeholders) and translate appropriately
5. **Save Translations**: Use `nab-al-tools-saveTranslatedTexts` to persist translations with proper target states
6. **Verify Completion**: Check for remaining untranslated texts and continue if needed
7. **Quality Review**: Final verification of translation quality and consistency

**Multi-File Support**: The prompt explicitly guides users to loop through all XLF files in the Translations folder for comprehensive language coverage.

### 2. review-translations

**Purpose**: Review and improve existing translations in XLF files

**Description**: This prompt helps users find translations that need review, analyze them for quality, and make improvements. It focuses on ensuring translation accuracy, context appropriateness, and consistency with business terminology. Supports batch review and looping through all XLF files for a language.

**Arguments**:

- `appFolderPath` (required): Path to the AL application folder containing the Translations subfolder
- `targetLanguage` (required): Target language code to review (e.g., 'da-DK', 'de-DE', 'fr-FR')
- `reviewState` (optional): Translation state to review - 'needs-review', 'translated', 'final', or 'signed-off'. Defaults to 'needs-review'

**Review Workflow**:

1. **Discover XLF Files for Review**: Identify XLF files in the Translations folder containing translations to review
2. **Analyze Translation States**: Get overview of current translation states using `nab-al-tools-getTranslatedTextsByState`
3. **Retrieve Translations for Review**: Process translations in batches with focus on specified review state
4. **Quality Assessment**: Systematic evaluation of accuracy, context appropriateness, length constraints, placeholder handling, business terminology, and grammar
5. **Improve Translations**: Provide better alternatives considering AL/Business Central context and consistency
6. **Save Improved Translations**: Update translations with appropriate target states using `nab-al-tools-saveTranslatedTexts`
7. **Continue Review Process**: Loop through all batches and verify completion

**Multi-File Support**: The prompt guides users to repeat the review workflow for each language's XLF file in the Translations folder.

### 3. translate-all-languages

**Purpose**: Comprehensive workflow to translate all XLF files (all languages) in an AL application

**Description**: This prompt provides a systematic approach to handle multiple language files, ensuring all translations are completed consistently across all target languages. It includes progress tracking and error handling for large-scale translation projects.

**Arguments**:

- `appFolderPath` (required): Path to the AL application folder containing the Translations subfolder
- `sourceLanguage` (optional): Source language code for reference (e.g., 'en-US'). Defaults to 'en-US' if not specified
- `batchSize` (optional): Number of texts to translate in each batch (default: 20, max: 100)
- `excludeLanguages` (optional): Comma-separated list of language codes to exclude (e.g., 'en-US,en-GB')

**Multi-Language Workflow**:

1. **Discover All XLF Files**: Identify all language files in the Translations folder and extract language codes
2. **Filter Languages**: Apply exclusion list and create prioritized language processing list
3. **Language Processing Loop**: For each target language, execute complete translation workflow:
   - Initialize current language and assess untranslated texts
   - Process translations in batches with progress tracking
   - Verify completion and log progress
4. **Cross-Language Consistency**: Compare translations across languages for consistency
5. **Final Quality Review**: Sample-check translations across all languages

**Features**:

- **Progress Tracking**: Maintains visibility of overall progress across all languages
- **Error Handling**: Graceful handling of missing files and failed translations
- **Batch Processing**: Efficient processing with configurable batch sizes
- **Language Filtering**: Ability to exclude specific languages from processing

### Using Prompts

Prompts can be discovered and used through MCP clients that support the prompts capability:

```bash
# List available prompts
mcp-client prompts/list

# Get a specific prompt with arguments
mcp-client prompts/get translate-app --appFolderPath="/path/to/app" --targetLanguage="da-DK"
```

When used, prompts return structured messages that guide the user through the translation workflow, providing specific instructions and referencing the appropriate tools to use at each step.

## Usage

### Command Line

```bash
# Start the MCP server
node src/mcp/server.ts

# Or if compiled
node out/mcp/server.js
```

### MCP Client Integration

The server implements the standard MCP protocol and can be integrated with any MCP-compatible client. Configure your MCP client to connect to this server using stdio transport.

Example Claude Desktop configuration:

```json
{
  "mcpServers": {
    "nab-al-tools": {
      "command": "node",
      "args": ["d:/path/to/nab-al-tools/extension/out/mcp/server.js"]
    }
  }
}
```

### VS Code Integration

The server is automatically available when using the NAB AL Tools VS Code extension with compatible language model tools.

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

### Debug Mode

Set environment variable `DEBUG=1` for verbose logging.

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
