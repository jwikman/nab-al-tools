import * as AdmZip from "adm-zip"; // Ref: https://www.npmjs.com/package/adm-zip
import * as fs from "fs";
import * as path from "path";
import { ALObject } from "../../ALObject/ALElementTypes";
import { ManifestPackage, NavxManifest } from "../interfaces/NavxManifest";
import { SymbolReference } from "../interfaces/SymbolReference";
import * as txml from "txml";
import { BinaryReader } from "../BinaryReader";
import * as FileFunctions from "../../FileFunctions";
export interface AppPackageMeta {
  name: string;
  publisher: string;
  version: string;
  packageId?: string;
  manifest?: ManifestPackage;
  symbolReference?: SymbolReference;
}

interface AppIdentifier {
  valid: boolean;
  name: string;
  publisher: string;
  version: string;
}
export class AppPackage {
  name: string;
  publisher: string;
  version: string;
  packageId?: string;
  manifest?: ManifestPackage;
  symbolReference?: SymbolReference;
  objects: ALObject[] = [];
  filePath: string;

  constructor(
    filePath: string,
    name: string,
    publisher: string,
    version: string,
    packageId?: string,
    manifest?: ManifestPackage,
    symbolReference?: SymbolReference
  ) {
    this.filePath = filePath;
    this.name = name;
    this.publisher = publisher;
    this.version = version;
    if (packageId) {
      this.packageId = packageId;
    }
    if (manifest) {
      this.manifest = manifest;
    }
    if (symbolReference) {
      this.symbolReference = symbolReference;
    }
  }

  static getAppPackage(appFilePath: string, loadSymbols = true): AppPackage {
    const appFileContent = AppPackage.getAppFileContent(appFilePath);
    let symbols: SymbolReference;
    const manifest: ManifestPackage = (<NavxManifest>(
      txml.simplifyLostLess(txml.parse(appFileContent.manifest) as txml.tNode[])
    )).Package[0];
    const appPackage: AppPackage = new AppPackage(
      appFilePath,
      manifest.App[0]._attributes.Name,
      manifest.App[0]._attributes.Publisher,
      manifest.App[0]._attributes.Version,
      appFileContent.packageId,
      manifest
    );
    if (loadSymbols) {
      symbols = <SymbolReference>JSON.parse(appFileContent.symbolReference);
      appPackage.symbolReference = symbols;
    }
    return appPackage;
  }

  static appIdentifier(filePath: string): AppIdentifier {
    let fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    fileName = fileName.slice(0, fileName.length - ext.length);
    const appIdentifier: AppIdentifier = {
      valid: false,
      name: fileName,
      publisher: "",
      version: "",
    };
    if (fileName.indexOf("_") > 0) {
      const appParts = fileName.split("_");
      appIdentifier.valid = true;
      appIdentifier.name = appParts[1];
      appIdentifier.publisher = appParts[0];
      appIdentifier.version = appParts[2];
    }
    return appIdentifier;
  }

  static getAppFileContent(
    appFilePath: string,
    loadSymbols = true
  ): { symbolReference: string; manifest: string; packageId: string } {
    let symbolReference = "";
    let manifest = "";
    const fileContent = fs.readFileSync(appFilePath);
    const view = new BinaryReader(fileContent, true);

    const magicNumber1 = view.getUint32(0);
    const metadataSize = view.getUint32(4);
    const metadataVersion = view.getUint32(8);

    const packageIdArray = Buffer.from(view.getBytes(16, 12));
    const byteArray: number[] = [];
    packageIdArray.forEach((b) => byteArray.push(b));
    const packageId = this.byteArrayToGuid(byteArray);
    const contentLength = view.getUint64(28);
    const magicNumber2 = view.getUint32(36);
    const magicNumber3 = view.getUint16(40);

    const appIdentifier = 0x5856414e; // "NAVX"
    const runtimePackageIdentifier = 20014; // "."
    const regularAppIdentifier = 19280; // "P"

    if (
      magicNumber1 !== appIdentifier ||
      magicNumber2 !== appIdentifier ||
      metadataVersion > 2
    ) {
      throw new Error(`"${appFilePath}" is not a valid app file`);
    }

    if (
      magicNumber3 !== runtimePackageIdentifier &&
      magicNumber3 !== regularAppIdentifier
    ) {
      throw new Error(
        `Unsupported package format (unknown package container type in "${appFilePath})"`
      );
    }

    if (magicNumber3 === runtimePackageIdentifier) {
      // Runtime Package
      throw new Error(`Runtime Packages is not supported (${appFilePath})`);
    }

    const buffer = Buffer.from(
      view.getBytes(contentLength.valueOf(), metadataSize)
    );

    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries(); // an array of ZipEntry records
    if (loadSymbols) {
      symbolReference = FileFunctions.getZipEntryContentOrEmpty(
        zipEntries,
        "SymbolReference.json"
      );
      symbolReference = symbolReference.replace(/\0/g, ""); // Trailing NULL characters seems to be common...
    }
    manifest = FileFunctions.getZipEntryContentOrEmpty(
      zipEntries,
      "NavxManifest.xml"
    );

    return {
      symbolReference: symbolReference,
      manifest: manifest,
      packageId: packageId,
    };
  }

  static byteArrayToGuid(byteArray: number[]): string {
    // reverse first four bytes, and join with following two reversed, joined with following two reversed, joined with rest of the bytes
    byteArray = byteArray
      .slice(0, 4)
      .reverse()
      .concat(byteArray.slice(4, 6).reverse())
      .concat(byteArray.slice(6, 8).reverse())
      .concat(byteArray.slice(8));

    let guidValue = byteArray
      .map(function (item) {
        // return hex value with "0" padding
        return ("00" + item.toString(16).toUpperCase()).substr(-2, 2);
      })
      .join("");
    guidValue = `${guidValue.substr(0, 8)}-${guidValue.substr(
      8,
      4
    )}-${guidValue.substr(12, 4)}-${guidValue.substr(16, 4)}-${guidValue.substr(
      20
    )}`;
    return guidValue.toLowerCase();
  }
}
