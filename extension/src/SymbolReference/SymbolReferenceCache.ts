import { AppPackage } from './types/AppPackage';

const cachedAppPackages: AppPackage[] = [];

export function addAppPackageToCache(appPackage: AppPackage): void {
    if (appPackageInCache(appPackage)) {
        // app already in cache
        return;
    }

    const appToCache = appPackage;
    appToCache.symbolReference = undefined; // Free up unnecessary memory allocation
    cachedAppPackages.push(appToCache);
    cachedAppPackages.sort((a, b) => { return a.sort(b); });
}

export function getAppPackageFromCache(name: string, publisher: string, version: string): AppPackage {
    const cachedAppPackage = cachedAppPackages.filter(p => p.name === name && p.publisher === publisher && p.version === version)[0];
    return cachedAppPackage;
}

function appPackageInCache(appPackage: AppPackage): boolean {
    return cachedAppPackages.filter(p => p.packageId === appPackage.packageId).length > 0;
}

export function appInCache(name: string, publisher: string, version: string): boolean {
    return cachedAppPackages.filter(p => p.name === name && p.publisher === publisher && p.version === version).length > 0;
}

