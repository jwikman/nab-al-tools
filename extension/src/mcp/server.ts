#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  refreshXlfFromGXlfCore,
  getTextsToTranslateCore,
  getTranslatedTextsMapCore,
  getTranslatedTextsByStateCore,
  getTextsByKeywordCore,
  saveTranslatedTextsCore,
  createTargetXlfFileCore,
  ITranslationToSave,
} from "../ChatTools/shared/XliffToolsCore";
import { getGlossaryTermsCore } from "../ChatTools/shared/GlossaryCore";
import {
  getAppFolderFromXlfPath,
  getSettingsForXlf,
  getAppManifestFromPath,
} from "../ChatTools/shared/ToolHelpers";
import * as path from "path";
import { allowedLanguageCodes } from "../shared/languages";

/**
 * Standardized error handling for MCP tools.
 */
function handleMcpToolError(
  error: unknown,
  operation: string
): {
  content: { type: "text"; text: string }[];
  isError: boolean;
} {
  if (error instanceof z.ZodError) {
    return {
      content: [
        {
          type: "text",
          text: `Input validation error: ${error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ")}`,
        },
      ],
      isError: true,
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    content: [
      {
        type: "text",
        text: `Error ${operation}: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

export const mcpServerId = "nab-al-tools-mcp-server";
export const mcpServerVersion = "0.1.43";

/**
 * NAB AL Tools MCP Server
 *
 * Provides translation management tools for AL language and Microsoft Dynamics 365 Business Central extensions.
 * This server implements the same tools as specified in the NAB AL Tools VS Code extension languageModelTools.
 */

// Create the MCP server
const server = new McpServer(
  {
    name: mcpServerId,
    version: mcpServerVersion,
  },
  {
    capabilities: {
      tools: {
        refreshXlf: {},
        getTextsToTranslate: {},
        getTranslatedTextsMap: {},
        getTranslatedTextsByState: {},
        saveTranslatedTexts: {},
        getGlossaryTerms: {},
        createLanguageXlf: {},
      },
    },
  }
);

// Define Zod schemas for input validation with proper descriptions
const refreshXlfSchema = z.object({
  generatedXlfFilePath: z
    .string()
    .describe(
      "The absolute path to the generated XLF file. The file is named '[app name].g.xlf', and the app name can be found in the app.json file. Example: For the app called 'My App', the generated Xlf file will be named 'My App.g.xlf'. This file is found in the Translations folder, which is the same folder as the target XLF file. This g.xlf file is automatically created and/or updated during AL compilation. Note that this file is often added to .gitignore, so you may need to show hidden and ignored files to find it."
    ),
  filePath: z.string().describe("The absolute path to the XLF file to refresh"),
  workspaceFilePath: z
    .string()
    .optional()
    .describe(
      "Path to the workspace (.code-workspace) file for additional settings. This parameter is MANDATORY when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file. Omitting this parameter when a workspace file exists may result in incorrect translation behavior or missing essential configuration."
    ),
});

const getTextsToTranslateSchema = z.object({
  filePath: z
    .string()
    .describe(
      "The absolute path to the XLF file from which untranslated texts will be extracted."
    ),
  offset: z
    .number()
    .min(0)
    .describe(
      "The starting position (zero-based index) for retrieving results. Used for pagination to skip a specific number of translation units before returning results."
    ),
  limit: z
    .number()
    .min(1)
    .describe(
      "The maximum number of untranslated texts to return. Set to 0 to retrieve all available texts."
    ),
  sourceLanguageFilePath: z
    .string()
    .optional()
    .describe(
      "Optional. The absolute path to an alternative source language file. When specified, target texts from this file will be used as 'source' in the response. Useful for translating between similar languages (e.g., Swedish, Danish, Norwegian) instead of always using en-US as the source."
    ),
});

const getTranslatedTextsMapSchema = z.object({
  filePath: z
    .string()
    .describe(
      "The absolute path to the XLF file from which to retrieve translated texts. This file should contain translation units with completed target elements."
    ),
  offset: z
    .number()
    .min(0)
    .describe(
      "The starting position (zero-based index) for retrieving results. Used for pagination to skip a specific number of translation units before returning results."
    ),
  limit: z
    .number()
    .min(1)
    .describe(
      "The maximum number of translated texts to return in a single request. Controls result set size for pagination. Set to 0 to retrieve all available translations."
    ),
  sourceLanguageFilePath: z
    .string()
    .optional()
    .describe(
      "Optional. The absolute path to an alternative source language file. When specified, target texts from this file will be used as 'source' in the response. Particularly useful when translating between similar languages (e.g., Swedish, Danish, Norwegian) instead of always using en-US as the source."
    ),
});

const getTranslatedTextsByStateSchema = z.object({
  filePath: z
    .string()
    .describe(
      "The absolute path to the XLF file from which to retrieve translated texts. This file should contain translation units with translated target elements."
    ),
  offset: z
    .number()
    .min(0)
    .describe(
      "The starting position (zero-based index) for retrieving results. Used for pagination to skip a specific number of translation units before returning results."
    ),
  limit: z
    .number()
    .min(1)
    .describe(
      "The maximum number of translated texts to return in a single request. Controls result set size for pagination. Set to 0 to retrieve all available translations."
    ),
  translationStateFilter: z
    .enum(["needs-review", "translated", "final", "signed-off"])
    .optional()
    .describe(
      "The translation state to filter the results by. This can be one of the following: 'needs-review' (returns all translations that need review), 'translated' (completed translations), 'final' (finalized translations), or 'signed-off' (approved translations). If not specified, translations in all states will be returned."
    ),
  sourceText: z
    .string()
    .optional()
    .describe(
      "Optional. Filter results to only include translations that match this exact source text. This is particularly useful for: 1) Finding all translations of a specific phrase or term across different contexts, 2) Reviewing translation consistency for repeated text, 3) Updating all occurrences of a specific source text during translation review. For example, use 'Customer' to find all translations where the source text is exactly 'Customer', or 'Enter a value' to find translations of that specific instruction text."
    ),
  sourceLanguageFilePath: z
    .string()
    .optional()
    .describe(
      "Optional. The absolute path to an alternative source language file. When specified, target texts from this file will be used as 'source' in the response. Particularly useful when translating between similar languages (e.g., Swedish, Danish, Norwegian) instead of always using en-US as the source."
    ),
});

const getTextsByKeywordSchema = z.object({
  filePath: z.string().describe("The absolute path to the XLF file to search."),
  offset: z
    .number()
    .min(0)
    .describe(
      "The starting position (zero-based index) for retrieving results. Used for pagination to skip a specific number of translation units before returning results."
    ),
  limit: z
    .number()
    .min(0)
    .describe(
      "The maximum number of texts to return in a single request. Set to 0 to retrieve all available translations."
    ),
  keyword: z
    .string()
    .min(1)
    .describe(
      "The keyword or regex pattern to search for in the source or target text."
    ),
  caseSensitive: z
    .boolean()
    .optional()
    .describe("Enable case-sensitive matching (default false)."),
  isRegex: z
    .boolean()
    .optional()
    .describe(
      "Treat the 'keyword' parameter as a regular expression (default false)."
    ),
  searchInTarget: z
    .boolean()
    .optional()
    .describe(
      "Search in target text instead of source text (default false). When true, only translated units with matching target text are returned."
    ),
});

const saveTranslatedTextsSchema = z.object({
  filePath: z
    .string()
    .describe(
      "The absolute path to the existing XLF file where translations should be saved. The file must already contain the translation units with source texts that correspond to the translations being provided."
    ),
  translations: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            "The unique identifier of the translation unit in the XLF file. This ID must match an existing translation unit in the file."
          ),
        targetText: z
          .string()
          .describe(
            "The translated text to be saved as the target content for the specified translation unit. This will replace any existing target text for the given unit."
          ),
        targetState: z
          .enum([
            "needs-review-translation",
            "translated",
            "final",
            "signed-off",
          ])
          .optional()
          .describe(
            "The target state of the translation unit. This can be one of the following: 'needs-review-translation', 'translated', 'final', 'signed-off'. If not specified, the target state will be 'translated' (or nothing, if not working with target states)."
          ),
      })
    )
    .min(1)
    .describe(
      "An array of translation objects to be saved to the XLF file. Each object must contain both the unique identifier of the translation unit and the translated text to be inserted."
    ),
  workspaceFilePath: z
    .string()
    .optional()
    .describe(
      "Path to the workspace (.code-workspace) file for additional settings. This parameter is MANDATORY when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file. Omitting this parameter when a workspace file exists may result in incorrect translation behavior or missing essential configuration."
    ),
});

const getGlossaryTermsSchema = z.object({
  targetLanguageCode: z
    .enum(allowedLanguageCodes)
    .describe(
      "Target language code for which glossary entries should be returned."
    ),
  sourceLanguageCode: z
    .enum(allowedLanguageCodes)
    .optional()
    .describe(
      "Optional source language code (default en-US) used as the source terminology column."
    ),
});

const createLanguageXlfSchema = z.object({
  generatedXlfFilePath: z
    .string()
    .describe(
      "The absolute path to the generated XLF file (*.g.xlf) created by AL compilation. This file is found in the Translations folder and is automatically created during AL compilation."
    ),
  targetLanguageCode: z
    .string()
    .describe(
      "Language code for the new XLF file (e.g., 'sv-SE', 'da-DK', 'de-DE')."
    ),
  matchBaseAppTranslation: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether to match translations from the base app (default: false). When enabled, the tool will pre-populate the new XLF file with matching translations from Microsoft's base application. Requires an internet connection to fetch translations from Microsoft's servers."
    ),
  workspaceFilePath: z
    .string()
    .optional()
    .describe(
      "Path to the workspace (.code-workspace) file for additional settings. This parameter is MANDATORY when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file. Omitting this parameter when a workspace file exists may result in incorrect translation behavior or missing essential configuration."
    ),
});

// Tool 1: refreshXlf
// Refresh and synchronize a XLF language file using the generated XLF file
server.registerTool(
  "refreshXlf",
  {
    description:
      "This tool refreshes and synchronizes a XLF language file using the generated XLF file. It should be called before starting the translation process to ensure the XLF file is up-to-date with the latest AL code changes, and again after all translations have been completed to ensure everything is handled and finalized. It takes two parameters: the path to the generated XLF file (named <appname>.g.xlf) and the path to the target XLF file to be refreshed. The tool synchronizes the target XLF file with the latest changes from the generated file by preserving existing translations while adding new translation units from the generated file. It maintains the state of translated units and sorts the file according to the g.xlf structure. This synchronization process ensures that the translation file stays up-to-date with the latest AL code changes without losing existing translation work. The workspaceFilePath parameter is mandatory when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file.",
    inputSchema: refreshXlfSchema.shape,
    annotations: {
      title: "Refresh XLF Translation File",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      // Validate input parameters
      const parsed = refreshXlfSchema.parse(args);
      const { generatedXlfFilePath, filePath, workspaceFilePath } = parsed;

      // Load settings and execute core function
      const settings = getSettingsForXlf(filePath, workspaceFilePath);
      const result = await refreshXlfFromGXlfCore(
        generatedXlfFilePath,
        filePath,
        settings
      );

      return {
        content: [
          {
            type: "text",
            text: result.data,
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "refreshing XLF file");
    }
  }
);

// Tool 2: getTextsToTranslate
// Retrieve untranslated texts from a specified XLF file
server.registerTool(
  "getTextsToTranslate",
  {
    description:
      "This tool retrieves untranslated texts from a specified XLF file. It returns a JSON array of objects containing: id (unique identifier), source text (to be translated), source language, type (describes the context of what is being translated, such as 'Table Customer - Field Name - Property Caption' or 'Page Sales Order - Action Post - Property Caption'), maxLength (character limit if applicable), and contextual comments (explains placeholders like %1, %2, %3 etc.). The type field provides crucial context by identifying the specific AL object (table, page, codeunit, etc.), element (field, action, control), and property (caption, tooltip, etc.) being translated, enabling more accurate and contextually appropriate translations. This tool streamlines the translation workflow by identifying which texts need translation and providing comprehensive context for accurate localization. The workspaceFilePath parameter is mandatory when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file.",
    inputSchema: getTextsToTranslateSchema.shape,
    annotations: {
      title: "Get Texts to Translate",
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      // Validate input parameters
      const parsed = getTextsToTranslateSchema.parse(args);
      const { filePath, offset, limit, sourceLanguageFilePath } = parsed;

      // Execute core function (no settings needed for read-only operation)
      const result = getTextsToTranslateCore(
        filePath,
        offset,
        limit,
        sourceLanguageFilePath
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "retrieving texts to translate");
    }
  }
);

// Tool 3: getTranslatedTextsMap
// Get previously translated texts from a specified XLF file as a translation map
server.registerTool(
  "getTranslatedTextsMap",
  {
    description:
      "This tool retrieves previously translated texts from a specified XLF file as a translation map. It returns a JSON array of translation objects, each containing: sourceText (the original text), targetTexts (an array of one or more translated versions), and sourceLanguage. This unique format groups all translations by their source text, which is particularly useful when the same source text has been translated differently in various contexts or has multiple acceptable translations. For example: {'sourceText': 'Total', 'targetTexts': ['Total', 'Totalt'], 'sourceLanguage': 'en-us'}. This tool helps maintain translation consistency by providing access to existing translation patterns and terminology variations, allowing you to reference previously translated phrases and understand translation choices when working on new content. The workspaceFilePath parameter is mandatory when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file.",
    inputSchema: getTranslatedTextsMapSchema.shape,
    annotations: {
      title: "Get Translated Texts Map",
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      // Validate input parameters
      const parsed = getTranslatedTextsMapSchema.parse(args);
      const { filePath, offset, limit, sourceLanguageFilePath } = parsed;

      // Execute core function (no settings needed for read-only operation)
      const result = getTranslatedTextsMapCore(
        filePath,
        offset,
        limit,
        sourceLanguageFilePath
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "retrieving translated texts map");
    }
  }
);

// Tool 4: getTranslatedTextsByState
// Get translated texts filtered by their translation state
server.registerTool(
  "getTranslatedTextsByState",
  {
    description:
      "This tool retrieves translated texts from a specified XLF file, filtered by their translation state. It returns a JSON array of objects containing: id (unique identifier), source text, source language, target text, type (describes the context of what is being translated, such as 'Table Customer - Field Name - Property Caption' or 'Page Sales Order - Action Post - Property Caption'), translation state, review reason (if available), maxLength (character limit if applicable), and contextual comments (explains placeholders like %1, %2, %3 etc.). The type field provides crucial context by identifying the specific AL object (table, page, codeunit, etc.), element (field, action, control), and property (caption, tooltip, etc.) being translated, enabling better understanding of existing translations and their business context. This tool streamlines the translation workflow by allowing you to filter translations by their state (e.g., 'needs-review', 'translated', 'final', 'signed-off') and providing comprehensive context for accurate localization. The workspaceFilePath parameter is mandatory when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file.",
    inputSchema: getTranslatedTextsByStateSchema.shape,
    annotations: {
      title: "Get Translated Texts by State",
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      // Validate input parameters
      const parsed = getTranslatedTextsByStateSchema.parse(args);
      const {
        filePath,
        offset,
        limit,
        translationStateFilter,
        sourceText,
        sourceLanguageFilePath,
      } = parsed;

      // Execute core function (no settings needed for read-only operation)
      const result = getTranslatedTextsByStateCore(
        filePath,
        offset,
        limit,
        translationStateFilter,
        sourceText,
        sourceLanguageFilePath
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "retrieving translated texts by state");
    }
  }
);

// Tool: getTextsByKeyword
server.registerTool(
  "getTextsByKeyword",
  {
    description:
      "This tool searches source or target texts in an XLF file for a given keyword or regex and returns matching translation units. By default, it searches in source texts (includes untranslated units). When searchInTarget is true, it searches only in target texts (excludes untranslated units). Use this to discover how a specific word or phrase is used across the application and to inspect how it has been translated in different contexts.",
    inputSchema: getTextsByKeywordSchema.shape,
    annotations: {
      title: "Get Texts by Keyword",
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      const parsed = getTextsByKeywordSchema.parse(args);
      const {
        filePath: kwFilePath,
        offset: kwOffset,
        limit: kwLimit,
        keyword,
        caseSensitive,
        isRegex,
        searchInTarget,
      } = parsed;
      // Execute core function (no settings needed for read-only operation)
      const result = getTextsByKeywordCore(
        kwFilePath,
        kwOffset,
        kwLimit,
        keyword,
        caseSensitive || false,
        isRegex || false,
        searchInTarget || false
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "searching texts by keyword");
    }
  }
);

// Tool 5: saveTranslatedTexts
// Save translated texts to a specified XLF file
server.registerTool(
  "saveTranslatedTexts",
  {
    description:
      "This tool writes translated texts to a specified XLF file. It accepts an array of translation objects, each containing a unique identifier and the translated text to be saved. For optimal performance, submit multiple translations in a single batch rather than making individual calls. This tool enables efficient updating of XLF files with new or revised translations, maintaining the integrity of the XLIFF format while updating only the specified translation units. The workspaceFilePath parameter is mandatory when the app is part of a VS Code workspace, as critical translation settings (like target language configuration, custom translation rules, and formatting options) are often defined in the workspace file.",
    inputSchema: saveTranslatedTextsSchema.shape,
    annotations: {
      title: "Save Translated Texts",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      // Validate input parameters
      const parsed = saveTranslatedTextsSchema.parse(args);
      const { filePath, translations, workspaceFilePath } = parsed;

      // Load settings and execute core function
      const settings = getSettingsForXlf(filePath, workspaceFilePath);
      const result = saveTranslatedTextsCore(
        filePath,
        translations as ITranslationToSave[],
        settings
      );

      return {
        content: [
          {
            type: "text",
            text: result.data,
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "saving translated texts");
    }
  }
);

// Tool: createLanguageXlf
server.registerTool(
  "createLanguageXlf",
  {
    description:
      "This tool creates a new XLF file for a specified target language based on a generated XLF file. It takes a generated XLF file path (*.g.xlf), a target language code, and optional parameters to match translations from the base app and specify workspace settings. The tool creates a new XLF file ready for translation, optionally pre-populated with matching translations from Microsoft's base application. This streamlines the localization workflow by providing a foundation for translating AL extensions to new languages.",
    inputSchema: createLanguageXlfSchema.shape,
    annotations: {
      title: "Create Target Language XLF File",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (args) => {
    try {
      const parsed = createLanguageXlfSchema.parse(args);
      const {
        generatedXlfFilePath,
        targetLanguageCode,
        matchBaseAppTranslation,
        workspaceFilePath,
      } = parsed;

      const appFolderPath = getAppFolderFromXlfPath(generatedXlfFilePath);
      const settings = getSettingsForXlf(
        generatedXlfFilePath,
        workspaceFilePath
      );
      const appManifest = getAppManifestFromPath(appFolderPath);

      const result = await createTargetXlfFileCore(
        settings,
        generatedXlfFilePath,
        targetLanguageCode,
        matchBaseAppTranslation,
        appManifest
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully created XLF file: "${result.data.targetXlfFilepath}" with ${result.data.numberOfMatches} matches.`,
          },
        ],
      };
    } catch (error) {
      return handleMcpToolError(error, "creating XLF file");
    }
  }
);

// Tool: getGlossaryTerms
server.registerTool(
  "getGlossaryTerms",
  {
    description:
      "This tool returns glossary terminology pairs for a target language (and optional source language, default en-us) from a built-in glossary, based on Business Central terminology and translations. It outputs a JSON array of objects with 'source', 'target', and 'description'. Usage scenarios: (1) Before starting a translation session - fetch glossary and feed to the LLM/agent prompt to enforce consistent terminology. (2) During automated translation suggestion generation - validate candidate targets against approved glossary terms. (3) QA/Review phase - highlight deviations from glossary to prioritize corrections. (4) Bulk alignment - use glossary list to perform search/replace or to seed a terminology memory. (5) Cross-language comparison - specify a non-default sourceLanguageCode to compare two non-English columns while still using English as reference if needed.",
    inputSchema: getGlossaryTermsSchema.shape,
    annotations: {
      title: "Get Glossary Entries",
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    try {
      const parsed = getGlossaryTermsSchema.parse(args);
      const { targetLanguageCode, sourceLanguageCode } = parsed;
      const glossaryFilePath = path.join(
        __dirname,
        "..",
        "..",
        "resources",
        "glossary.tsv"
      );
      const result = getGlossaryTermsCore(
        glossaryFilePath,
        targetLanguageCode,
        sourceLanguageCode || "en-us"
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    } catch (error) {
      return handleMcpToolError(error, "retrieving glossary");
    }
  }
);

/**
 * Start the MCP server
 */
async function main(): Promise<void> {
  // The server logs to stderr for debugging while keeping stdout clean for MCP communication.
  console.error("Starting NAB AL Tools MCP Server...");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("NAB AL Tools MCP Server is running on stdio transport");
}

// Handle process termination gracefully
process.on("SIGINT", async () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Fatal error in NAB AL Tools MCP Server:", error);
  process.exit(1);
});
