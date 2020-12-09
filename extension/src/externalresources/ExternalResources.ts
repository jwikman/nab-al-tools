import { createWriteStream, WriteStream, existsSync } from 'fs';
import * as path from 'path';

import Axios from 'axios';
import { isNullOrUndefined } from 'util';

interface ExternalResourceInterface {
    name: string;
    uri: string;
    data: string | undefined;
    get(writeStream: WriteStream): Promise<string>;
}

interface BlobContainerInterface {
    baseUrl: string;
    blobs: ExternalResource[];
    exportPath: string;
    sasToken: string;
    getBlobs(filter: string[]|undefined): void;
    addBlob(name: string, uri: string): void;
}

export class ExternalResource implements ExternalResourceInterface {
    uri: string;
    name: string;
    data: undefined;

    constructor(name: string, uri: string,) {
        this.name = name;
        this.uri = uri;
    }

    public async get(writeStream: WriteStream): Promise<string> {
        const response = await Axios({
            url: this.url().href,
            method: "GET",
            responseType: "stream"
        });

        response.data.pipe(writeStream);

        return new Promise((resolve, reject) => {
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });
    }

    public url(): URL {
        return new URL(this.uri);
    }
}

export class BlobContainer implements BlobContainerInterface {
    baseUrl: string;
    blobs: ExternalResource[] = [];
    sasToken: string;
    exportPath: string;

    constructor(exportPath: string, baseUrl: string, sasToken: string) {
        this.baseUrl = baseUrl;
        this.exportPath = exportPath;
        this.sasToken = sasToken;
    }

    public getBlobs(languageCodeFilter?: string[]) {
        if (!existsSync(this.exportPath)) {
            throw new Error(`Directory does not exist: ${this.exportPath}`);
        }
        let blobs: ExternalResource[] = [];
        if(isNullOrUndefined(languageCodeFilter)) {
            blobs = this.blobs;
        } else {
            languageCodeFilter.forEach(code => {
                let blob = this.blobs.filter(b => b.name.indexOf(code) >= 0)[0];
                if (blob) {
                    blobs.push(blob);
                }
            });
        }

        blobs.forEach(blob => {
            let writeStream = createWriteStream(path.resolve(this.exportPath, blob.name), "utf8");
            blob.get(writeStream);
        });
    }

    public addBlob(name: string): void {
        let uri = this.url(name);
        this.blobs.push(new ExternalResource(name, uri.toString()));
    }

    public getBlobByName(name: string): ExternalResource {
        return this.blobs.filter(b => b.name === name)[0];
    }

    public url(name: string): URL {
        return new URL(`${this.baseUrl}${name}?${this.sasToken}`);
    }
}
