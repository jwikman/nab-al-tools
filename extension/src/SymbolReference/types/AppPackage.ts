import { ALObject } from "../../ALObject/ALElementTypes";
import { ManifestPackage } from "../interfaces/NavxManifest";
import { SymbolReference } from "../interfaces/SymbolReference";


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
}
