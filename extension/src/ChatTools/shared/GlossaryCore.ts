import * as fs from "fs";
import * as path from "path";

export interface IGlossaryEntry {
  source: string;
  target: string;
  description: string;
}

export interface IGlossaryCoreResult {
  data: IGlossaryEntry[];
  telemetry: { [key: string]: string | number | boolean | undefined };
}

/**
 * Reads the glossary.tsv file and returns glossary entries for the specified languages.
 * @param glossaryFilePath Absolute path to resources/glossary.tsv
 * @param targetLanguageCode Required target language code (case-insensitive match against header columns)
 * @param sourceLanguageCode Optional source language code, default en-US
 */
export function getGlossaryCore(
  glossaryFilePath: string,
  targetLanguageCode: string,
  sourceLanguageCode = "en-US"
): IGlossaryCoreResult {
  if (!glossaryFilePath) {
    throw new Error("glossaryFilePath is required (absolute path).");
  }
  if (!fs.existsSync(glossaryFilePath)) {
    throw new Error(`Glossary file not found at path ${glossaryFilePath}`);
  }
  if (!targetLanguageCode) {
    throw new Error("targetLanguageCode is required.");
  }
  const raw = fs.readFileSync(glossaryFilePath, { encoding: "utf-8" });
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { data: [], telemetry: { entryCount: 0 } };
  }

  const header = lines[0].split(/\t/).map((h) => h.trim());
  const descriptionIdx = header.findIndex(
    (h) => h.toLowerCase() === "description"
  );
  if (descriptionIdx === -1) {
    throw new Error("Description column not found in glossary.tsv header.");
  }

  // Normalize case-insensitive lookup
  const headerMap: { [lower: string]: number } = {};
  header.forEach((h, idx) => (headerMap[h.toLowerCase()] = idx));
  const targetIdx = headerMap[targetLanguageCode.toLowerCase()];
  if (targetIdx === undefined) {
    throw new Error(
      `Target language column '${targetLanguageCode}' not found in glossary.tsv.`
    );
  }
  const sourceIdx = headerMap[sourceLanguageCode.toLowerCase()];
  if (sourceIdx === undefined) {
    throw new Error(
      `Source language column '${sourceLanguageCode}' not found in glossary.tsv.`
    );
  }

  const entries: IGlossaryEntry[] = [];
  // Start from line 1 to skip header; preserve file order (per requirement 4a)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\t/);
    // Guard for ragged lines
    if (parts.length <= Math.max(targetIdx, sourceIdx, descriptionIdx)) {
      continue;
    }
    const source = (parts[sourceIdx] || "").trim();
    const target = (parts[targetIdx] || "").trim();
    const description = (parts[descriptionIdx] || "").trim();
    // Requirement 3c: Include only rows where both source and target non-empty
    if (!source || !target) {
      continue;
    }
    entries.push({ source, target, description });
  }

  return {
    data: entries,
    telemetry: {
      entryCount: entries.length,
      sourceLanguage: sourceLanguageCode,
      targetLanguage: targetLanguageCode,
      fileName: path.basename(glossaryFilePath),
    },
  };
}
