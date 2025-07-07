# NAB AL Tools MCP Server

The NAB AL Tools extension includes a fully functional MCP (Model Context Protocol) server that provides comprehensive translation management tools for AI assistants like Claude Desktop and other MCP-compatible clients.

## What is MCP?

MCP (Model Context Protocol) allows AI assistants to securely access tools and data sources. The NAB AL Tools MCP server provides 5 specialized tools for XLF (XLIFF) translation file management, utilizing the same core functionality as the VS Code extension.

## Available Tools

All tools are **fully implemented and functional**:

1. **refreshXlf** - Refresh and synchronize a XLF language file using the generated XLF file
2. **getTextsToTranslate** - Retrieve untranslated texts from a specified XLF file
3. **getTranslatedTextsMap** - Get previously translated texts as a translation map
4. **getTranslatedTextsByState** - Get translated texts filtered by their translation state
5. **saveTranslatedTexts** - Save translated texts to a specified XLF file

Each tool includes comprehensive input validation, error handling, and utilizes the same underlying translation logic as the VS Code extension commands.

## Tool Details

### refreshXlf

**Purpose**: Synchronize XLF files with the latest AL code changes
**Parameters**:

- `generatedXlfFilePath`: Path to the generated .g.xlf file
- `filePath`: Path to the target XLF file to refresh
- `workspaceFilePath`: (Optional) Path to workspace file for settings

### getTextsToTranslate

**Purpose**: Get untranslated texts that need translation
**Parameters**:

- `filePath`: Path to the XLF file
- `offset`: Starting position for pagination
- `limit`: Maximum number of results to return
- `sourceLanguageFilePath`: (Optional) Alternative source language file
- `workspaceFilePath`: (Optional) Path to workspace file for settings

### getTranslatedTextsMap

**Purpose**: Get existing translations grouped by source text
**Parameters**: Same as getTextsToTranslate
**Returns**: Translation map with source texts and their various translations

### getTranslatedTextsByState

**Purpose**: Get translations filtered by their completion state
**Parameters**: Same as getTextsToTranslate, plus:

- `translationStateFilter`: (Optional) Filter by state: needs-review, translated, final, signed-off
- `sourceText`: (Optional) Filter by specific source text

### saveTranslatedTexts

**Purpose**: Save new or updated translations to XLF file
**Parameters**:

- `filePath`: Path to the XLF file
- `translations`: Array of translation objects with id, targetText, and optional targetState
- `workspaceFilePath`: (Optional) Path to workspace file for settings

## Setup Instructions

### For Claude Desktop

1. **Locate the Extension Installation**

   Find your NAB AL Tools extension installation directory:

   - **Windows**: `%USERPROFILE%\.vscode\extensions\nabsolutions.nab-al-tools-*\`
   - **macOS**: `~/.vscode/extensions/nabsolutions.nab-al-tools-*/`
   - **Linux**: `~/.vscode/extensions/nabsolutions.nab-al-tools-*/`

2. **Configure Claude Desktop**

   Add the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "nab-al-tools": {
         "command": "node",
         "args": ["[EXTENSION_PATH]/dist/mcp/server.js"]
       }
     }
   }
   ```

   Replace `[EXTENSION_PATH]` with the actual path to your extension directory.

   **Example for Windows:**

   ```json
   {
     "mcpServers": {
       "nab-al-tools": {
         "command": "node",
         "args": [
           "C:\\Users\\YourUsername\\.vscode\\extensions\\nabsolutions.nab-al-tools-1.40.0\\dist\\mcp\\server.js"
         ]
       }
     }
   }
   ```

   **Note:** Replace the version number (1.40.0) with your actual installed version.

3. **Restart Claude Desktop**

   After updating the configuration, restart Claude Desktop to load the MCP server.

### For Other MCP Clients

The server supports the standard MCP protocol over stdio transport. Configure your client to run:

```bash
node [EXTENSION_PATH]/dist/mcp/server.js
```

## Usage Examples

Once configured, you can ask Claude (or your MCP client) to help with comprehensive translation tasks:

### Real Examples:

- "Get the first 10 untranslated texts from my German XLF file at `C:\MyProject\app\Translations\MyApp.de-DE.xlf`"
- "Show me all translations that need review from state 'needs-review'"
- "Refresh my German translation file from the generated XLF"
- "Save these translations to my XLF file with target state 'translated'"
- "Get a translation map of previously translated terms to maintain consistency"
- "Find all translations containing the source text 'Customer' for consistency checking"

### Advanced Usage:

The tools support advanced features like:

- **Pagination**: Use `offset` and `limit` parameters for large files
- **State filtering**: Filter by translation states (needs-review, translated, final, signed-off)
- **Source language files**: Use alternative source languages for translation between similar languages
- **Batch operations**: Save multiple translations in a single operation
- **Workspace detection**: Automatic detection of AL project settings

## Troubleshooting

### Common Issues

1. **"Command not found" errors**

   - Ensure Node.js is installed and accessible from your PATH
   - Verify the extension path is correct

2. **"Permission denied" errors**

   - Check file permissions on the extension directory
   - On macOS/Linux, you may need to make the script executable

3. **Server fails to start**

   - Check VS Code's output for any extension installation issues
   - Try reinstalling the NAB AL Tools extension
   - Ensure the compiled server file exists at `[EXTENSION_PATH]/dist/mcp/server.js`

4. **"Module not found" errors**
   - Verify Node.js version compatibility (Node.js 16+ recommended)
   - Check that all dependencies are installed (should be bundled with extension)

### Debugging Tips

1. **Test the server directly**:

   ```bash
   node [EXTENSION_PATH]/dist/mcp/server.js
   ```

   The server should start and show "Starting NAB AL Tools MCP Server..." message.

2. **Check MCP client logs**:

   - Claude Desktop: Check the application logs for MCP connection errors
   - Other clients: Enable verbose logging to see server communication

3. **Validate file paths**:
   - Ensure XLF files are in a 'Translations' folder
   - Use absolute paths for all file parameters
   - Check file permissions

### Getting Help

If you encounter issues:

1. Check the [NAB AL Tools GitHub repository](https://github.com/jwikman/nab-al-tools) for known issues
2. Report bugs via the GitHub issues page
3. Include your OS, VS Code version, Claude Desktop version, and NAB AL Tools extension version in bug reports
