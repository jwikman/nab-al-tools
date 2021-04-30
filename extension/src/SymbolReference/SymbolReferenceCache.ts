import * as semver from 'semver';
import * as fs from 'fs';
import * as path from 'path';
import { AppPackage } from './Interfaces/AppPackage';
import { CachedApp } from './Interfaces/CachedApp';
import { createFolderIfNotExist } from '../Common';
import * as stringify from 'json-stringify-safe';

let cachedApps: CachedApp[] = [];
const cacheFolder = path.join(__dirname, '.packageCache');
createFolderIfNotExist(cacheFolder);

export function addAppPackageToCache(appPackage: AppPackage) {
    if (appPackageInCache(appPackage)) {
        // app already in cache
        return;
    }

    const packageCachePath = getAppPackageCachePath(appPackage.packageId);
    const newAppPackage: AppPackage = { filePath: appPackage.filePath, manifest: appPackage.manifest, packageId: appPackage.packageId, lastModified: appPackage.lastModified, objects: appPackage.objects };
    fs.writeFileSync(packageCachePath, stringify(newAppPackage, null, 4), "utf8");

    let appToCache: CachedApp = new CachedApp(appPackage.filePath, appPackage.manifest.App[0]._attributes.Name, appPackage.manifest.App[0]._attributes.Publisher, appPackage.manifest.App[0]._attributes.Version, appPackage.packageId);
    cachedApps.push(appToCache);
    cachedApps.sort((a, b) => { return a.sort(b) });
}

export function getAppPackageFromCache(name: string, publisher: string, version: string) {
    let cachedApp = cachedApps.filter(p => p.name === name && p.publisher === publisher && p.version === version)[0];
    if (!(cachedApp.packageId)) {
        return
    }
    let appPackage: AppPackage = JSON.parse(fs.readFileSync(getAppPackageCachePath(cachedApp.packageId), 'utf8'));
    return appPackage;
}

function getAppPackageCachePath(packageId: string) {
    return path.join(cacheFolder, `${packageId}.json`);
}

function appPackageInCache(appPackage: AppPackage) {
    return cachedApps.filter(p => p.packageId === appPackage.packageId).length > 0;
}

export function appInCache(name: string, publisher: string, version: string) {
    return cachedApps.filter(p => p.name === name && p.publisher === publisher && p.version === version).length > 0;
}

