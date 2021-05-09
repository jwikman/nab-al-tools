import { ALObject } from "../../ALObject/ALElementTypes";
import { ManifestPackage } from "../interfaces/NavxManifest";
import { SymbolReference } from "../interfaces/SymbolReference";
import * as Version from "../../helpers/Version";

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

  public sort(other: AppPackage): number {
    if (this.publisher !== other.publisher) {
      return this.publisher.localeCompare(other.publisher);
    }
    if (this.name !== other.name) {
      return this.name.localeCompare(other.name);
    }
    if (Version.lt(other.version, this.version)) {
      return -1;
    } else if (Version.gt(other.version, this.version)) {
      return 1;
    }
    return 0;
  }
}
