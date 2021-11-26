import * as fs from "fs";
import * as path from "path";
import Axios from "axios";
import { SharedAccessSignature } from "./SharedAccessSignature";

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
  succeded: string[];
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
    // ref. https://stackoverflow.com/a/61269447
    return Axios({
      url: this.url().href,
      method: "GET",
      responseType: "stream",
    }).then((response) => {
      //ensure that the user can call `then()` only when the file has
      //been downloaded entirely.

      return new Promise((resolve, reject) => {
        response.data.pipe(writeStream);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let error: any;
        writeStream.on("error", (err) => {
          error = err;
          writeStream.close();
          reject(err);
        });
        writeStream.on("close", () => {
          if (!error) {
            resolve(true);
          }
          //no need to call the reject here, as it will have been called in the
          //'error' stream;
        });
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
    const downloadResult: BlobDownloadResult = { succeded: [], failed: [] };
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
      await blob.get(writeStream).catch(() => {
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
        console.log(
          `Failed to parse: ${blob.name}. Error: ${(e as Error).message}`
        );
        downloadResult.failed.push(blob.name);
        fs.unlinkSync(writeStream.path);
        continue;
      }
      downloadResult.succeded.push(blob.name);
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
    if (!this.tokenIsValid()) {
      throw new Error(`SASToken has expired. Token: ${this.sasToken}`);
    }
    return new URL(`${this.baseUrl}${name}?${this.sasToken}`);
  }

  public tokenIsValid(): boolean {
    return this.sasToken.daysUntilExpiration() > 0;
  }
}
