import { AppPackage, AppIdentifier } from "./types/AppPackage";

export class SymbolReferenceCache {
  private cache: Map<string, AppPackage>;

  public get size(): number {
    return this.cache.size;
  }

  constructor() {
    this.cache = new Map();
  }

  private id(app: AppIdentifier): string {
    return `${app.name}-${app.publisher}-${app.version}`;
  }

  get(app: AppIdentifier): AppPackage | undefined {
    return this.cache.get(this.id(app));
  }

  set(appPackage: AppPackage): void {
    if (this.isCached(appPackage)) {
      return;
    }
    const appToCache = appPackage;
    //TODO: Test if objects share reference
    appToCache.symbolReference = undefined; // Free up unnecessary memory allocation
    this.cache.set(this.id(appToCache), appToCache);
  }

  isCached(app: AppIdentifier): boolean {
    return this.cache.get(this.id(app)) !== undefined;
  }

  delete(app: AppPackage): boolean {
    return this.cache.delete(this.id(app));
  }

  clear(): void {
    this.cache.clear();
  }
}

export const symbolReferenceCache = new SymbolReferenceCache();
