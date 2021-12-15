import { Xliff } from "./XLIFFDocument";
import * as path from "path";

const cachedXliffDocuments: Map<string, Xliff> = new Map();

export function getXliffDocumentFromCache(filePath: string): Xliff {
  const fileName = path.basename(filePath);
  if (!xliffDocumentInCache(fileName)) {
    const newXliffDocument = Xliff.fromFileSync(filePath);
    cachedXliffDocuments.set(fileName, newXliffDocument);
    return newXliffDocument;
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
  const newXliffDocument = Xliff.fromString(content);
  cachedXliffDocuments.set(fileName, newXliffDocument);
}

function xliffDocumentInCache(fileName: string): boolean {
  return cachedXliffDocuments.has(fileName);
}
