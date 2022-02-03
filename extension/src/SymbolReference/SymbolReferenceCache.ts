import { AppPackage, AppIdentifier } from "./types/AppPackage";

export class SymbolReferenceCache {
  private cache: Map<string, AppPackage>;

  public get size(): number {
    return this.cache.size;
  }

  constructor() {
    this.cache = new Map();
  }

  static key(appId: AppIdentifier): string {
    return `${appId.name}-${appId.publisher}-${appId.version}`;
  }

  get(appId: AppIdentifier): AppPackage | undefined {
    return this.cache.get(SymbolReferenceCache.key(appId));
  }

  set(appPackage: AppPackage): void {
    if (this.isCached(appPackage)) {
      return;
    }
    const appToCache = appPackage;
    this.cache.set(SymbolReferenceCache.key(appToCache), appToCache);
  }

  isCached(appId: AppIdentifier): boolean {
    return this.cache.has(SymbolReferenceCache.key(appId));
  }

  delete(appId: AppIdentifier): boolean {
    return this.cache.delete(SymbolReferenceCache.key(appId));
  }

  clear(): void {
    this.cache.clear();
  }
}

export const symbolReferenceCache = new SymbolReferenceCache();
