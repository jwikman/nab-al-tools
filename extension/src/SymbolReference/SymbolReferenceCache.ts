import { AppPackage, AppPackageMeta } from "./types/AppPackage";

class SymbolReferenceCache {
  private cache: Map<string, AppPackage>;

  public get size(): number {
    return this.cache.size;
  }

  constructor() {
    this.cache = new Map();
  }

  private id(app: AppPackageMeta): string {
    return `${app.name}-${app.publisher}-${app.version}`;
  }

  get(app: AppPackageMeta): AppPackage | undefined {
    return this.cache.get(this.id(app));
  }

  add(appPackage: AppPackage): void {
    if (this.isCached(appPackage)) {
      return;
    }
    const appToCache = appPackage;
    //TODO: Test if objects share reference
    appToCache.symbolReference = undefined; // Free up unnecessary memory allocation
    this.cache.set(this.id(appToCache), appToCache);
  }

  update(appPackage: AppPackage): void {
    const appToCache = appPackage;
    //TODO: Test if objects share reference
    appToCache.symbolReference = undefined; // Free up unnecessary memory allocation
    this.cache.set(this.id(appToCache), appToCache);
  }

  isCached(app: AppPackageMeta): boolean {
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
