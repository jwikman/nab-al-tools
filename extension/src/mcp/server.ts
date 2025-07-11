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
const server = new McpServer(
  {
    name: "nab-al-tools-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      prompts: {},
    },
  }
);

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
  "nab-al-tools-mcp-refreshXlf",
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
  "nab-al-tools-mcp-getTextsToTranslate",
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
  "nab-al-tools-mcp-getTranslatedTextsMap",
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
  "nab-al-tools-mcp-getTranslatedTextsByState",
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
  "nab-al-tools-mcp-saveTranslatedTexts",
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

// Register prompts
server.registerPrompt(
  "translate-app",
  {
    title: "Translate AL Application",
    description:
      "Complete workflow to translate all XLF files in an AL application to a target language. This prompt guides you through the process of finding untranslated texts, translating them using AI, and saving the translations back to the XLF files.",
    argsSchema: {
      appFolderPath: z
        .string()
        .describe(
          "Path to the AL application folder containing the Translations subfolder"
        ),
      targetLanguage: z
        .string()
        .describe("Target language code (e.g., 'da-DK', 'de-DE', 'fr-FR')"),
      sourceLanguage: z
        .string()
        .optional()
        .describe(
          "Source language code for reference (e.g., 'en-US'). Optional, will use default if not specified."
        ),
      batchSize: z
        .string()
        .optional()
        .describe(
          "Number of texts to translate in each batch (default: 20, max: 100)"
        ),
    },
  },
  ({ appFolderPath, targetLanguage, sourceLanguage, batchSize }) => {
    const effectiveSourceLanguage = sourceLanguage || "en-US";
    const effectiveBatchSize = Math.min(
      Math.max(Number(batchSize) || 20, 1),
      100
    );

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to translate all XLF files in my AL application to ${targetLanguage}. Here's my comprehensive workflow:

**Application Details:**
- App folder: ${appFolderPath}
- Target language: ${targetLanguage}
- Source language: ${effectiveSourceLanguage}
- Batch size: ${effectiveBatchSize} texts per batch

**Step 1: Discover XLF Files**
First, I need to identify all XLF files in the Translations folder that need translation to ${targetLanguage}:
1. List all files in the Translations folder (${appFolderPath}/Translations/)
2. Find the target language XLF file (e.g., ${targetLanguage}.xlf or AppName.${targetLanguage}.xlf)
3. Identify the corresponding source language file if needed for reference

**Step 2: Initialize Translation for Target XLF File**
For the ${targetLanguage} XLF file:
1. Check if the file exists, if not, it may need to be created first
2. Use 'nab-al-tools-mcp-getTextsToTranslate' tool to get an overview of untranslated texts
3. Determine the total number of texts that need translation

**Step 3: Process Translations in Batches**
For efficient processing, translate texts in batches of ${effectiveBatchSize}:
1. **Batch Loop**: For each batch (starting at offset 0, incrementing by ${effectiveBatchSize}):
   - Use 'nab-al-tools-mcp-getTextsToTranslate' with current offset and limit
   - If no texts returned, move to next phase
   - For each text in the batch:
     * Analyze the context (type: Table/Page/Field/Action/etc.)
     * Consider character limits (maxLength) where specified
     * Understand placeholder patterns (%1, %2, %3, etc.) from comments
     * Translate maintaining the original meaning and AL/Business Central context
     * Ensure translations are appropriate for Business Central users
   - Collect all translations for the batch
   - Use 'nab-al-tools-mcp-saveTranslatedTexts' tool to save the batch
   - Set appropriate target state ('translated' for new translations)

**Step 4: Verify Completion**
After processing all batches:
1. Use 'nab-al-tools-mcp-getTextsToTranslate' with offset 0 to check if any texts remain
2. If texts remain, continue with additional batches
3. Use 'nab-al-tools-mcp-getTranslatedTextsByState' to verify saved translations

**Step 5: Quality Review**
Final verification:
- Review a sample of translations for quality
- Check that placeholders are handled correctly
- Verify business terminology consistency
- Ensure proper handling of AL-specific terms

**Multi-Language Support:**
If your app contains multiple language files (e.g., da-DK.xlf, de-DE.xlf, fr-FR.xlf), repeat this entire workflow for each target language file in the Translations folder.

Please help me execute this workflow step by step. Start by helping me discover the XLF files in the Translations folder and then guide me through the batch translation process for the ${targetLanguage} file.`,
          },
        },
      ],
    };
  }
);

server.registerPrompt(
  "review-translations",
  {
    title: "Review Translations",
    description:
      "Review and improve existing translations in XLF files. This prompt helps you find translations that need review, analyze them for quality, and make improvements.",
    argsSchema: {
      appFolderPath: z
        .string()
        .describe(
          "Path to the AL application folder containing the Translations subfolder"
        ),
      targetLanguage: z
        .string()
        .describe(
          "Target language code to review (e.g., 'da-DK', 'de-DE', 'fr-FR')"
        ),
      reviewState: z
        .enum(["needs-review", "translated", "final", "signed-off"])
        .optional()
        .describe(
          "Translation state to review: 'needs-review', 'translated', 'final', or 'signed-off'"
        ),
    },
  },
  ({ appFolderPath, targetLanguage, reviewState }) => {
    const effectiveReviewState = reviewState || "needs-review";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to review and improve existing translations in my AL application for ${targetLanguage} language.

**Review Details:**
- App folder: ${appFolderPath}
- Target language: ${targetLanguage}
- Focus on: ${effectiveReviewState} translations

**Review Workflow:**

**Step 1: Discover XLF Files for Review**
Identify and examine XLF files in the Translations folder:
1. List all files in the Translations folder (${appFolderPath}/Translations/)
2. Find the ${targetLanguage} XLF file that contains translations to review
3. Verify the file exists and is accessible
4. Get an overview of translation states in the file

**Step 2: Analyze Translation States**
Before starting the review, understand the current state:
1. Use 'nab-al-tools-mcp-getTranslatedTextsByState' with different states to get counts
2. Focus on ${effectiveReviewState} translations for this review session
3. Determine the total number of translations that need review

**Step 3: Retrieve Translations for Review in Batches**
Process translations systematically in manageable batches:
1. **Batch Loop**: For each review batch (starting at offset 0):
   - Use 'nab-al-tools-mcp-getTranslatedTextsByState' tool with:
     * translationStateFilter: "${effectiveReviewState}"
     * offset: current position
     * limit: reasonable batch size (20-50 items)
   - If no translations returned, review is complete
   - Include context information (type, comments, maxLength) for each translation

**Step 4: Quality Assessment for Each Translation**
For each translation in the current batch, systematically evaluate:
- **Accuracy**: Does the translation convey the correct meaning?
- **Context Appropriateness**: Is it suitable for the AL object type (Table, Page, Field, etc.)?
- **Length Constraints**: Does it fit within maxLength limitations?
- **Placeholder Handling**: Are %1, %2, %3 placeholders correctly preserved?
- **Business Terminology**: Is business-specific terminology consistent and appropriate?
- **Grammar and Style**: Is the translation grammatically correct and stylistically appropriate?
- **AL/Business Central Context**: Does it make sense in the Business Central UI/reports?

**Step 5: Improve and Update Translations**
For translations that need improvement:
1. Provide better alternatives considering:
   - Original context and meaning
   - Consistency with existing terminology
   - Proper placeholder patterns and formatting
   - Character limit constraints
   - Business domain appropriateness
2. Collect all improved translations for the batch
3. Use 'nab-al-tools-mcp-saveTranslatedTexts' tool to save improvements
4. Set appropriate target state:
   - 'translated' → 'final' (for approved translations)
   - 'needs-review' → 'translated' (for reviewed/improved translations)
   - 'final' → keep as 'final' (for minor improvements)

**Step 6: Continue Review Process**
1. Move to the next batch of ${effectiveReviewState} translations
2. Repeat steps 3-5 until all translations are reviewed
3. Use 'nab-al-tools-mcp-getTranslatedTextsByState' to verify completion

**Step 7: Final Verification**
After completing the review:
- Check overall translation consistency across the file
- Verify that all ${effectiveReviewState} translations have been processed
- Consider reviewing other translation states if needed

**Multi-Language Support:**
If your app contains multiple language files, repeat this entire review workflow for each language's XLF file in the Translations folder.

Please help me start this review process by discovering the ${targetLanguage} XLF file and retrieving the first batch of ${effectiveReviewState} translations that need attention.`,
          },
        },
      ],
    };
  }
);

server.registerPrompt(
  "translate-all-languages",
  {
    title: "Translate All Languages in AL Application",
    description:
      "Comprehensive workflow to translate all XLF files (all languages) in an AL application. This prompt provides a systematic approach to handle multiple language files, ensuring all translations are completed consistently across all target languages.",
    argsSchema: {
      appFolderPath: z
        .string()
        .describe(
          "Path to the AL application folder containing the Translations subfolder"
        ),
      sourceLanguage: z
        .string()
        .optional()
        .describe(
          "Source language code for reference (e.g., 'en-US'). Optional, will use default if not specified."
        ),
      batchSize: z
        .string()
        .optional()
        .describe(
          "Number of texts to translate in each batch (default: 20, max: 100)"
        ),
      excludeLanguages: z
        .string()
        .optional()
        .describe(
          "Comma-separated list of language codes to exclude (e.g., 'en-US,en-GB')"
        ),
    },
  },
  ({ appFolderPath, sourceLanguage, batchSize, excludeLanguages }) => {
    const effectiveSourceLanguage = sourceLanguage || "en-US";
    const effectiveBatchSize = Math.min(
      Math.max(Number(batchSize) || 20, 1),
      100
    );
    const excludedLanguages = excludeLanguages
      ? excludeLanguages.split(",").map((lang) => lang.trim())
      : [];

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need to translate ALL language files in my AL application systematically. Here's my comprehensive multi-language workflow:

**Application Details:**
- App folder: ${appFolderPath}
- Source language: ${effectiveSourceLanguage}
- Batch size: ${effectiveBatchSize} texts per batch
- Excluded languages: ${
              excludedLanguages.length > 0
                ? excludedLanguages.join(", ")
                : "None"
            }

**Multi-Language Translation Workflow:**

**Step 1: Discover All XLF Files**
First, I need to identify all language files in the application:
1. List all XLF files in the Translations folder (${appFolderPath}/Translations/)
2. Identify language codes from filenames (e.g., da-DK.xlf, de-DE.xlf, fr-FR.xlf)
3. Filter out excluded languages: ${
              excludedLanguages.length > 0
                ? excludedLanguages.join(", ")
                : "None"
            }
4. Create a prioritized list of languages to translate
5. Identify the source language file (${effectiveSourceLanguage}) for reference

**Step 2: Language Processing Loop**
For each target language file identified, execute a complete translation workflow:

**Step 2a: Initialize Current Language**
- Current target language: [Language from file list]
- Source file: ${effectiveSourceLanguage}.xlf (for reference)
- Target file: [current-language].xlf

**Step 2b: Assessment Phase**
- Use 'nab-al-tools-mcp-getTextsToTranslate' to assess untranslated texts
- Get total count of texts needing translation
- Log progress: "Processing [language]: X texts need translation"

**Step 2c: Batch Translation Loop**
For efficient processing, translate in batches of ${effectiveBatchSize}:
1. **For each batch** (offset: 0, ${effectiveBatchSize}, ${
              effectiveBatchSize * 2
            }, ...):
   - Use 'nab-al-tools-mcp-getTextsToTranslate' with current offset and limit
   - If no texts returned, move to next language
   - **Translate each text considering:**
     * AL object context (Table, Page, Field, Action, etc.)
     * Character limits (maxLength) from metadata
     * Placeholder patterns (%1, %2, %3, etc.) preservation
     * Business Central UI/domain appropriateness
     * Language-specific cultural considerations
   - Collect all translations for the batch
   - Use 'nab-al-tools-mcp-saveTranslatedTexts' to save the batch
   - Set target state: 'translated'
   - Log progress: "Batch saved: X/Y texts completed for [language]"

**Step 2d: Language Completion Verification**
- Use 'nab-al-tools-mcp-getTextsToTranslate' with offset 0 to verify completion
- If texts remain, continue with additional batches
- Log completion: "Language [language] translation completed: X texts translated"

**Step 3: Cross-Language Consistency Check**
After completing all languages:
1. Compare translations across languages for consistency
2. Verify that common terms are translated consistently
3. Check that placeholder handling is uniform across all languages

**Step 4: Final Quality Review**
For each completed language:
1. Use 'nab-al-tools-mcp-getTranslatedTextsByState' to review 'translated' states
2. Sample-check translations for quality
3. Identify any translations that need review

**Progress Tracking:**
Throughout the process, maintain visibility of:
- Total languages to process
- Current language being processed
- Completion percentage for current language
- Overall progress across all languages

**Error Handling:**
- If a language file is missing, log and continue with next language
- If batch translation fails, retry with smaller batch size
- If individual text translation fails, mark for manual review

Please help me execute this comprehensive multi-language workflow. Start by discovering all XLF files in the Translations folder and creating the language processing list.`,
          },
        },
      ],
    };
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
