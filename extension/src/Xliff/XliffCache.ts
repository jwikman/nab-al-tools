import { Xliff } from "./XLIFFDocument";
import * as path from "path";
import { InvalidXmlError } from "../Error";

const cachedXliffDocuments: Map<string, Xliff> = new Map();

export function getXliffDocumentFromCache(filePath: string): Xliff {
  const fileName = path.basename(filePath);
  if (!xliffDocumentInCache(fileName)) {
    try {
      const newXliffDocument = Xliff.fromFileSync(filePath);
      cachedXliffDocuments.set(fileName, newXliffDocument);
      return newXliffDocument;
    } catch (error) {
      console.log(`Error while reading "${fileName}":`, error.message);
      throw error;
    }
  }
  const xliffDocument = cachedXliffDocuments.get(fileName);
  if (xliffDocument) {
    return xliffDocument;
  }
  throw new Error(`${fileName} not found.`);
}
export function updateXliffDocumentInCache(
  filePath: string,
  content: string
): void {
  const fileName = path.basename(filePath);
  try {
    const newXliffDocument = Xliff.fromString(content);
    cachedXliffDocuments.set(fileName, newXliffDocument);
  } catch (error) {
    if (error instanceof InvalidXmlError) {
      error.path = filePath;
    }
    throw error;
  }
}

function xliffDocumentInCache(fileName: string): boolean {
  return cachedXliffDocuments.has(fileName);
}
