import { createWriteStream, WriteStream, existsSync } from 'fs';
import * as path from 'path';

import Axios from 'axios';

interface ExternalResourceInterface {
    name: string;
    uri: string;
    data: string | undefined;
    get(writeStream: WriteStream): Promise<string>;
}

interface BlobContainerInterface {
    blobs: ExternalResource[];
    exportPath: string;
    getBlobs(): void;
    addBlob(name: string, uri: string): void;
}

class ExternalResource implements ExternalResourceInterface {
    uri: string;
    name: string;
    data: undefined;

    constructor(name: string, uri: string,) {
        this.uri = uri;
        this.name = name;
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

class BlobContainer implements BlobContainerInterface {
    blobs: ExternalResource[] = [];
    exportPath: string;

    constructor(exportPath: string) {
        this.exportPath = exportPath;
    }

    public getBlobs() {
        if (!existsSync(this.exportPath)) {
            throw new Error(`Directory does not exist: ${this.exportPath}`);
        }
        this.blobs.forEach(blob => {
            let writeStream = createWriteStream(path.resolve(this.exportPath, blob.name), "utf8");
            blob.get(writeStream);
        });
    }

    public addBlob(name: string, uri: string): void {
        this.blobs.push(new ExternalResource(name, uri));
    }

    public getBlobByName(name: string): ExternalResource {
        return this.blobs.filter(b => b.name === name)[0];
    }
}

export { 
    BlobContainer, 
    ExternalResource 
};
