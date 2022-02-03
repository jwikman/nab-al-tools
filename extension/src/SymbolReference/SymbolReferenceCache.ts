import { AppPackage, AppIdentifier } from "./types/AppPackage";

export class SymbolReferenceCache {
  private cache: Map<AppIdentifier, AppPackage>;

  public get size(): number {
    return this.cache.size;
  }

  constructor() {
    this.cache = new Map();
  }

  get(app: AppIdentifier): AppPackage | undefined {
    return this.cache.get(app);
  }

  set(appPackage: AppPackage): void {
    if (this.isCached(appPackage)) {
      return;
    }
    const appToCache = appPackage;
    //TODO: Test if objects share reference
    appToCache.symbolReference = undefined; // Free up unnecessary memory allocation
    this.cache.set(appToCache, appToCache);
  }

  isCached(app: AppIdentifier): boolean {
    return this.cache.get(app) !== undefined;
  }

  delete(app: AppPackage): boolean {
    return this.cache.delete(app);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const symbolReferenceCache = new SymbolReferenceCache();
