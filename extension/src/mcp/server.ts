#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as CliSettingsLoader from "../Settings/CliSettingsLoader";
import {
  refreshXlfFromGXlfCore,
  getTextsToTranslateCore,
  getTranslatedTextsMapCore,
  getTranslatedTextsByStateCore,
  saveTranslatedTextsCore,
  ITranslationToSave,
} from "../ChatTools/shared/XliffToolsCore";
import * as path from "path";

/**
 * Extract app folder path from XLF file path.
 * XLF files are always in the Translations folder under the app folder.
 */
function getAppFolderFromXlfPath(xlfFilePath: string): string {
  const xlfDir = path.dirname(xlfFilePath);
  const translationsDir = path.basename(xlfDir);

  if (translationsDir.toLowerCase() !== "translations") {
    throw new Error(
      `XLF file must be in a 'Translations' folder. Found: ${xlfDir}`
    );
  }

  return path.dirname(xlfDir);
}

/**
 * Get settings for an XLF file using CLI settings loader
 */
function getSettingsForXlf(
  xlfFilePath: string,
  workspaceFilePath?: string
): ReturnType<typeof CliSettingsLoader.getSettings> {
  const appFolderPath = getAppFolderFromXlfPath(xlfFilePath);
  return CliSettingsLoader.getSettings(appFolderPath, workspaceFilePath);
}

/**
 * NAB AL Tools MCP Server
 *
 * Provides translation management tools for AL language and Microsoft Dynamics 365 Business Central extensions.
 * This server implements the same tools as specified in the NAB AL Tools VS Code extension languageModelTools.
 */

// Create the MCP server
const server = new McpServer({
  name: "nab-al-tools-mcp-server",
  version: "1.0.0",
});

// Define Zod schemas for input validation with proper descriptions
const refreshXlfSchema = z.object({
  generatedXlfFilePath: z
    .string()
    .describe(
      "Path to the generated XLF file (*.g.xlf) created by AL compilation"
    ),
  filePath: z
    .string()
    .describe("Path to the target XLF file to be refreshed/synchronized"),
  workspaceFilePath: z
    .string()
    .optional()
    .describe("Optional path to the workspace file for additional settings"),
});

const getTextsToTranslateSchema = z.object({
  filePath: z
    .string()
    .describe("Path to the XLF file to retrieve untranslated texts from"),
  offset: z
    .number()
    .min(0)
    .describe("Starting position for pagination (0-based index)"),
  limit: z
    .number()
    .min(1)
    .describe("Maximum number of texts to retrieve (1-1000)"),
  sourceLanguageFilePath: z
    .string()
    .optional()
    .describe("Optional path to the source language XLF file for reference"),
  workspaceFilePath: z
    .string()
    .optional()
    .describe("Optional path to the workspace file for additional settings"),
});

const getTranslatedTextsMapSchema = z.object({
  filePath: z
    .string()
    .describe("Path to the XLF file to retrieve translated texts map from"),
  offset: z
    .number()
    .min(0)
    .describe("Starting position for pagination (0-based index)"),
  limit: z
    .number()
    .min(1)
    .describe("Maximum number of translation groups to retrieve (1-1000)"),
  sourceLanguageFilePath: z
    .string()
    .optional()
    .describe("Optional path to the source language XLF file for reference"),
  workspaceFilePath: z
    .string()
    .optional()
    .describe("Optional path to the workspace file for additional settings"),
});

const getTranslatedTextsByStateSchema = z.object({
  filePath: z
    .string()
    .describe("Path to the XLF file to retrieve translated texts from"),
  offset: z
    .number()
    .min(0)
    .describe("Starting position for pagination (0-based index)"),
  limit: z
    .number()
    .min(1)
    .describe("Maximum number of texts to retrieve (1-1000)"),
  translationStateFilter: z
    .enum(["needs-review", "translated", "final", "signed-off"])
    .optional()
    .describe(
      "Filter by translation state: needs-review, translated, final, or signed-off"
    ),
  sourceText: z
    .string()
    .optional()
    .describe(
      "Optional filter to find translations containing this source text"
    ),
  sourceLanguageFilePath: z
    .string()
    .optional()
    .describe("Optional path to the source language XLF file for reference"),
  workspaceFilePath: z
    .string()
    .optional()
    .describe("Optional path to the workspace file for additional settings"),
});

const saveTranslatedTextsSchema = z.object({
  filePath: z
    .string()
    .describe("Path to the XLF file where translations will be saved"),
  translations: z
    .array(
      z.object({
        id: z
          .string()
          .describe("Unique identifier of the translation unit to update"),
        targetText: z.string().describe("The translated text to save"),
        targetState: z
          .enum([
            "needs-review-translation",
            "translated",
            "final",
            "signed-off",
          ])
          .optional()
          .describe("Optional state to set for the translation unit"),
      })
    )
    .min(1)
    .describe(
      "Array of translation objects to save (1-100 items for optimal performance)"
    ),
  workspaceFilePath: z
    .string()
    .optional()
    .describe("Optional path to the workspace file for additional settings"),
});

// Tool 1: refreshXlf
// Refresh and synchronize a XLF language file using the generated XLF file
server.registerTool(
  "nab-al-tools-refreshXlf",
  {
    description:
      "This tool refreshes and synchronizes a XLF language file using the generated XLF file. It takes two parameters: the path to the generated XLF file (named <appname>.g.xlf) and the path to the target XLF file to be refreshed. The tool synchronizes the target XLF file with the latest changes from the generated file by preserving existing translations while adding new translation units from the generated file. It maintains the state of translated units and sorts the file according to the g.xlf structure. This synchronization process ensures that the translation file stays up-to-date with the latest AL code changes without losing existing translation work.",
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
      // Detailed error handling
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

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error refreshing XLF file: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 2: getTextsToTranslate
// Retrieve untranslated texts from a specified XLF file
server.registerTool(
  "nab-al-tools-getTextsToTranslate",
  {
    description:
      "This tool retrieves untranslated texts from a specified XLF file. It returns a JSON array of objects containing: id (unique identifier), source text (to be translated), source language, type (describes the context of what is being translated, such as 'Table Customer - Field Name - Property Caption' or 'Page Sales Order - Action Post - Property Caption'), maxLength (character limit if applicable), and contextual comments (explains placeholders like %1, %2, %3 etc.). The type field provides crucial context by identifying the specific AL object (table, page, codeunit, etc.), element (field, action, control), and property (caption, tooltip, etc.) being translated, enabling more accurate and contextually appropriate translations. This tool streamlines the translation workflow by identifying which texts need translation and providing comprehensive context for accurate localization.",
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
      // Detailed error handling
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

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving texts to translate: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 3: getTranslatedTextsMap
// Get previously translated texts from a specified XLF file as a translation map
server.registerTool(
  "nab-al-tools-getTranslatedTextsMap",
  {
    description:
      "This tool retrieves previously translated texts from a specified XLF file as a translation map. It returns a JSON array of translation objects, each containing: sourceText (the original text), targetTexts (an array of one or more translated versions), and sourceLanguage. This unique format groups all translations by their source text, which is particularly useful when the same source text has been translated differently in various contexts or has multiple acceptable translations. For example: {'sourceText': 'Total', 'targetTexts': ['Total', 'Totalt'], 'sourceLanguage': 'en-US'}. This tool helps maintain translation consistency by providing access to existing translation patterns and terminology variations, allowing you to reference previously translated phrases and understand translation choices when working on new content.",
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
      // Detailed error handling
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

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving translated texts map: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 4: getTranslatedTextsByState
// Get translated texts filtered by their translation state
server.registerTool(
  "nab-al-tools-getTranslatedTextsByState",
  {
    description:
      "This tool retrieves translated texts from a specified XLF file, filtered by their translation state. It returns a JSON array of objects containing: id (unique identifier), source text, source language, target text, type (describes the context of what is being translated, such as 'Table Customer - Field Name - Property Caption' or 'Page Sales Order - Action Post - Property Caption'), translation state, review reason (if available), maxLength (character limit if applicable), and contextual comments (explains placeholders like %1, %2, %3 etc.). The type field provides crucial context by identifying the specific AL object (table, page, codeunit, etc.), element (field, action, control), and property (caption, tooltip, etc.) being translated, enabling better understanding of existing translations and their business context. This tool streamlines the translation workflow by allowing you to filter translations by their state (e.g., 'needs-review', 'translated', 'final', 'signed-off') and providing comprehensive context for accurate localization.",
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
      // Detailed error handling
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

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving translated texts by state: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool 5: saveTranslatedTexts
// Save translated texts to a specified XLF file
server.registerTool(
  "nab-al-tools-saveTranslatedTexts",
  {
    description:
      "This tool writes translated texts to a specified XLF file. It accepts an array of translation objects, each containing a unique identifier and the translated text to be saved. For optimal performance, submit multiple translations in a single batch rather than making individual calls. This tool enables efficient updating of XLF files with new or revised translations, maintaining the integrity of the XLIFF format while updating only the specified translation units.",
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
      // Detailed error handling
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

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error saving translated texts: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Start the MCP server
 */
async function main(): Promise<void> {
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
