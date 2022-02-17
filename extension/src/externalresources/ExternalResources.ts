import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { SharedAccessSignature } from "./SharedAccessSignature";
import { logger } from "../Logging/LogHelper";

interface ExternalResourceInterface {
  name: string;
  uri: string;
  data: string | undefined;
  get(writeStream: fs.WriteStream): Promise<boolean>;
}

interface BlobContainerInterface {
  baseUrl: string;
  blobs: ExternalResource[];
  exportPath: string;
  sasToken: SharedAccessSignature;
  getBlobs(filter: string[] | undefined): Promise<BlobDownloadResult>;
  addBlob(name: string, uri: string): void;
}

interface BlobDownloadResult {
  succeeded: string[];
  failed: string[];
}

export class ExternalResource implements ExternalResourceInterface {
  uri: string;
  name: string;
  data: undefined;

  constructor(name: string, uri: string) {
    this.name = name;
    this.uri = uri;
  }

  public async get(writeStream: fs.WriteStream): Promise<boolean> {
    return new Promise((resolve, reject) => {
      https
        .get(this.url().href, (res) => {
          res.on("error", reject);
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject({
                response: {
                  status: res.statusCode,
                  headers: res.headers,
                  message: res.statusMessage,
                },
              });
            }
          });
          res.pipe(writeStream);
          writeStream.on("finish", () => {
            writeStream.close();
            resolve(true);
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  }

  public url(): URL {
    return new URL(this.uri);
  }
}

export class BlobContainer implements BlobContainerInterface {
  baseUrl: string;
  blobs: ExternalResource[] = [];
  sasToken: SharedAccessSignature;
  exportPath: string;

  constructor(exportPath: string, baseUrl: string, sasToken: string) {
    this.baseUrl = baseUrl;
    this.exportPath = exportPath;
    this.sasToken = new SharedAccessSignature(sasToken);
  }

  public async getBlobs(
    languageCodeFilter?: string[]
  ): Promise<BlobDownloadResult> {
    const downloadResult: BlobDownloadResult = { succeeded: [], failed: [] };
    if (!fs.existsSync(this.exportPath)) {
      throw new Error(`Directory does not exist: ${this.exportPath}`);
    }
    let blobs: ExternalResource[] = [];
    if (languageCodeFilter === undefined) {
      blobs = this.blobs;
    } else {
      languageCodeFilter.forEach((code) => {
        const blob = this.blobs.filter((b) => b.name.indexOf(code) >= 0)[0];
        if (blob) {
          blobs.push(blob);
        }
      });
    }
    for (const blob of blobs) {
      const writeStream = fs.createWriteStream(
        path.resolve(this.exportPath, blob.name),
        "utf8"
      );
      let downloadFailed = false;
      await blob.get(writeStream).catch((err) => {
        switch (err.response.status) {
          case 403:
            throw new Error(
              "Blob storage authentication failed. Please report this as an issue on GitHub (https://github.com/jwikman/nab-al-tools)."
            );
          case 404:
            // A warning will suffice this should be handled upstream with downloadResult.failed.
            logger.error(
              `Could not download ${blob.name}. Resource not found.`
            );
            break;
        }

        downloadFailed = true;
        fs.unlinkSync(writeStream.path);
      });

      if (downloadFailed) {
        downloadResult.failed.push(blob.name);
        continue;
      }
      try {
        JSON.parse(fs.readFileSync(writeStream.path.toString(), "utf8"));
      } catch (e) {
        logger.error(
          `Failed to parse: ${blob.name}. Error: ${(e as Error).message}`
        );
        downloadResult.failed.push(blob.name);
        fs.unlinkSync(writeStream.path);
        continue;
      }
      downloadResult.succeeded.push(blob.name);
    }
    return downloadResult;
  }

  public addBlob(name: string): void {
    const uri = this.url(name);
    this.blobs.push(new ExternalResource(name, uri.toString()));
  }

  public getBlobByName(name: string): ExternalResource {
    return this.blobs.filter((b) => b.name === name)[0];
  }

  public url(name: string): URL {
    return new URL(`${this.baseUrl}${name}?${this.sasToken}`);
  }
}
