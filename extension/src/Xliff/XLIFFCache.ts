import { Xliff } from "./XLIFFDocument";
import * as path from "path";
import { InvalidXmlError } from "../Error";
import { logger } from "../Logging/LogHelper";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { Settings } from "../Settings/Settings";

class XliffCache {
  private cache: Map<string, Xliff>;
  private enabled: boolean;

  public get size(): number {
    return this.cache.size;
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  constructor(settings: Settings) {
    this.cache = new Map();
    this.enabled = settings.enableXliffCache;
  }

  get(filePath: string): Xliff {
    const fileName = path.basename(filePath);
    const xliffDocument = this.cache.get(fileName) ?? this.read(filePath);
    if (this.enabled && !this.isCached(filePath)) {
      this.cache.set(fileName, xliffDocument);
    }
    return xliffDocument;
  }

  private read(filePath: string): Xliff {
    try {
      return Xliff.fromFileSync(filePath);
    } catch (error) {
      logger.error(
        `Error while reading "${path.basename(filePath)}":`,
        (error as Error).message
      );
      throw error;
    }
  }

  update(filePath: string, content: string): void {
    if (!this.enabled) {
      return;
    }
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
    return this.cache.get(path.basename(filePath)) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const xliffCache = new XliffCache(SettingsLoader.getSettings());
