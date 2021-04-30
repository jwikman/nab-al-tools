import { AppPackage } from './types/AppPackage';

let cachedAppPackages: AppPackage[] = [];

export function addAppPackageToCache(appPackage: AppPackage) {
    if (appPackageInCache(appPackage)) {
        // app already in cache
        return;
    }

    let appToCache = appPackage;
    appToCache.symbolReference = undefined; // Remove this memory hog
    cachedAppPackages.push(appToCache);
    cachedAppPackages.sort((a, b) => { return a.sort(b) });
}

export function getAppPackageFromCache(name: string, publisher: string, version: string) {
    let cachedAppPackage = cachedAppPackages.filter(p => p.name === name && p.publisher === publisher && p.version === version)[0];
    return cachedAppPackage;
}

function appPackageInCache(appPackage: AppPackage) {
    return cachedAppPackages.filter(p => p.packageId === appPackage.packageId).length > 0;
}

export function appInCache(name: string, publisher: string, version: string) {
    return cachedAppPackages.filter(p => p.name === name && p.publisher === publisher && p.version === version).length > 0;
}

