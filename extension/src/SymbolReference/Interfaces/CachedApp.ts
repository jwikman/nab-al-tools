import * as semver from "semver";

export class CachedApp {
    packageId?: string;
    filePath: string;
    name: string;
    publisher: string;
    version: string;

    constructor(filePath: string, name: string, publisher: string, version: string, packageId?: string,) {
        this.filePath = filePath;
        this.name = name;
        this.publisher = publisher;
        this.version = version;
        if (packageId) {
            this.packageId = packageId;
        }
    }

    public sort(other: CachedApp) {
        if (this.publisher !== other.publisher) {
            return this.publisher.localeCompare(other.publisher);
        }
        if (this.name !== other.name) {
            return this.name.localeCompare(other.name);
        }
        if (semver.lt(other.version, this.version)) {
            return -1;
        } else if (semver.gt(other.version, this.version)) {
            return 1;
        }
        return 0;
    }
}
