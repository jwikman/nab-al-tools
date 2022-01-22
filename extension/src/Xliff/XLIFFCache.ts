import { Xliff } from "./XLIFFDocument";
import * as path from "path";
import { InvalidXmlError } from "../Error";
import { logger } from "../Logging/LogHelper";

class XliffCache {
  private cache: Map<string, Xliff>;

  constructor() {
    this.cache = new Map();
  }

  get(filePath: string): Xliff {
    const fileName = path.basename(filePath);
    if (!this.isCached(filePath)) {
      try {
        this.cache.set(fileName, Xliff.fromFileSync(filePath));
      } catch (error) {
        logger.error(
          `Error while reading "${fileName}":`,
          (error as Error).message
        );
        throw error;
      }
    }
    const xliffDocument = this.cache.get(fileName);
    if (xliffDocument) {
      return xliffDocument;
    }
    throw new Error(`${fileName} not found.`);
  }

  update(filePath: string, content: string): void {
    try {
      this.cache.set(path.basename(filePath), Xliff.fromString(content));
    } catch (error) {
      if (error instanceof InvalidXmlError) {
        error.path = filePath;
      }
      throw error;
    }
  }

  delete(filePath: string): boolean {
    return this.cache.delete(path.basename(filePath));
  }

  isCached(filePath: string): boolean {
    return this.cache.has(path.basename(filePath));
  }

  clear(): void {
    this.cache.clear();
  }
}

export const xliffCache = new XliffCache();
