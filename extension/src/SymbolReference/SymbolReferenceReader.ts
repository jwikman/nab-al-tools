import * as AdmZip from "adm-zip"; // Ref: https://www.npmjs.com/package/adm-zip
import * as fs from "fs";
import * as path from "path";
import { isNullOrUndefined } from "util";
import {
  ALObject,
  ALControl,
  ALProperty,
  MultiLanguageObject,
} from "../ALObject/ALElementTypes";
import {
  ControlDefinition,
  ControlKind,
  PageDefinition,
  SymbolProperty,
  SymbolReference,
  TableDefinition,
} from "./interfaces/SymbolReference";
import { ALControlType, ALObjectType } from "../ALObject/Enums";
import { ALTableField } from "../ALObject/ALTableField";
import { alPropertyTypeMap, multiLanguageTypeMap } from "../ALObject/Maps";
import * as txml from "txml";
import { ManifestPackage, NavxManifest } from "./interfaces/NavxManifest";
import { AppPackage } from "./types/AppPackage";
import * as SymbolReferenceCache from "./SymbolReferenceCache";
import { ALPageField } from "../ALObject/ALPageField";
import { ALPagePart } from "../ALObject/ALPagePart";
import { BinaryReader } from "./BinaryReader";

export function getAppFileContent(
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
  const packageId = byteArrayToGuid(byteArray);
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

  const dataLength = view.byteLength - metadataSize;
  if (dataLength !== contentLength.valueOf()) {
    throw new Error(`Unexpected content length in '${appFilePath}'`);
  }

  const buffer = Buffer.from(view.getBytes(dataLength, metadataSize));

  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries(); // an array of ZipEntry records
  if (loadSymbols) {
    symbolReference = getZipEntryContentOrEmpty(
      zipEntries,
      "SymbolReference.json"
    );
    symbolReference = symbolReference.replace(/\0/g, ""); // Trailing NULL characters seems to be common...
  }
  manifest = getZipEntryContentOrEmpty(zipEntries, "NavxManifest.xml");

  return {
    symbolReference: symbolReference,
    manifest: manifest,
    packageId: packageId,
  };
}

function byteArrayToGuid(byteArray: number[]): string {
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

function getZipEntryContentOrEmpty(
  zipEntries: AdmZip.IZipEntry[],
  fileName: string
): string {
  const zipEntry = zipEntries.filter(
    (zipEntry) => zipEntry.name === fileName
  )[0];
  if (zipEntry === undefined) {
    return "";
  }
  let fileContent = zipEntry.getData().toString("utf8");
  if (fileContent.charCodeAt(0) === 0xfeff) {
    // Remove BOM
    fileContent = fileContent.substr(1);
  }
  return fileContent;
}
export function getAppPackage(
  appFilePath: string,
  loadSymbols = true
): AppPackage {
  const appFileContent = getAppFileContent(appFilePath);
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

export function getObjectsFromAppFile(appFilePath: string): AppPackage {
  const { name, publisher, version } = getAppIdentifiersFromFilename(
    appFilePath
  );

  let appPackage;
  if (SymbolReferenceCache.appInCache(name, publisher, version)) {
    appPackage = SymbolReferenceCache.getAppPackageFromCache(
      name,
      publisher,
      version
    );
    return appPackage;
  }
  appPackage = getAppPackage(appFilePath);
  parseObjectsInAppPackage(appPackage);
  SymbolReferenceCache.addAppPackageToCache(appPackage);
  return appPackage;
}

export function parseObjectsInAppPackage(appPackage: AppPackage): void {
  if (isNullOrUndefined(appPackage.symbolReference)) {
    return;
  }
  const objects: ALObject[] = [];
  appPackage.symbolReference.Tables.forEach((table) => {
    const obj = tableToObject(table);
    obj.alObjects = objects;
    objects.push(obj);
  });
  appPackage.symbolReference.Pages.forEach((page) => {
    const obj = pageToObject(page);
    obj.alObjects = objects;
    if (obj.sourceTable !== "") {
      // Substitute Table No. against Table Name
      const table = objects.filter(
        (tbl) =>
          tbl.objectType === ALObjectType.table &&
          tbl.objectId === Number(obj.sourceTable)
      )[0];
      if (table) {
        obj.sourceTable = table.name;
      }
    }
    objects.push(obj);
  });
  objects.filter((obj) =>
    obj
      .getAllControls()
      .filter((ctrl) => ctrl.type === ALControlType.part)
      .forEach((partControl) => {
        const alPagePart = partControl as ALPagePart;
        // Substitute Page no. against page names
        const page = objects.filter(
          (tbl) =>
            tbl.objectType === ALObjectType.page &&
            tbl.objectId === Number(alPagePart.value)
        )[0];
        if (page) {
          alPagePart.value = page.name;
        }
      })
  );

  appPackage.objects.push(...objects);
}

function tableToObject(table: TableDefinition): ALObject {
  const obj = new ALObject([], ALObjectType.table, 0, table.Name, table.Id);
  obj.generatedFromSymbol = true;
  table.Properties?.forEach((prop) => {
    addProperty(prop, obj);
  });
  table.Fields?.forEach((field) => {
    const alField = new ALTableField(
      ALControlType.tableField,
      field.Id as number,
      field.Name,
      field.TypeDefinition.Name
    );
    field.Properties?.forEach((prop) => {
      addProperty(prop, alField);
    });
    obj.controls.push(alField);
  });
  return obj;
}

function pageToObject(page: PageDefinition): ALObject {
  const obj = new ALObject([], ALObjectType.page, 0, page.Name, page.Id);
  obj.generatedFromSymbol = true;
  page.Properties?.forEach((prop) => {
    addProperty(prop, obj);
  });
  page.Controls?.forEach((control) => {
    addControl(control, obj);
  });
  return obj;
}

function addControl(control: ControlDefinition, parent: ALControl): void {
  let alControl: ALControl | undefined;
  if (control.Kind === ControlKind.Field) {
    const sourceExpr = control.Properties.filter(
      (prop) => prop.Name === "SourceExpression"
    )[0].Value;
    alControl = new ALPageField(
      ALControlType.pageField,
      control.Name,
      sourceExpr
    );
  } else if (control.Kind === ControlKind.Part) {
    let value = control.RelatedPagePartId?.Name;
    if (!value || value === "") {
      value = control.RelatedPagePartId?.Id?.toString();
    }
    alControl = new ALPagePart(ALControlType.part, control.Name, value || "");
  } else {
    let newAlControlType: ALControlType = ALControlType.none;
    switch (control.Kind) {
      case ControlKind.Area:
        newAlControlType = ALControlType.area;
        break;
      case ControlKind.CueGroup:
        newAlControlType = ALControlType.cueGroup;
        break;
      case ControlKind.Group:
        newAlControlType = ALControlType.group;
        break;
      case ControlKind.Repeater:
        newAlControlType = ALControlType.repeater;
        break;
    }
    if (newAlControlType !== ALControlType.none) {
      alControl = new ALControl(newAlControlType, control.Name);
    }
  }
  if (alControl !== undefined) {
    control.Properties?.forEach((prop) => {
      if (alControl !== undefined) {
        addProperty(prop, alControl);
      }
    });
    alControl.parent = parent;
    parent.controls.push(alControl);
    control.Controls?.forEach((c) => {
      if (alControl !== undefined) {
        addControl(c, alControl);
      }
    });
  }
}

function addProperty(prop: SymbolProperty, obj: ALControl): void {
  const type = multiLanguageTypeMap.get(prop.Name.toLowerCase());
  if (type) {
    const mlProp = new MultiLanguageObject(obj, type, prop.Name);
    mlProp.text = prop.Value;
    obj.multiLanguageObjects.push(mlProp);
  } else if (alPropertyTypeMap.has(prop.Name.toLowerCase())) {
    obj.properties.push(new ALProperty(obj, 0, prop.Name, prop.Value));
  }
}

export function getAppIdentifiersFromFilename(
  filePath: string
): { valid: boolean; name: string; publisher: string; version: string } {
  let fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  fileName = fileName.substr(0, fileName.length - ext.length);
  if (fileName.indexOf("_") > 0) {
    const appParts = fileName.split("_");
    return {
      valid: true,
      name: appParts[1],
      publisher: appParts[0],
      version: appParts[2],
    };
  }
  return { valid: false, name: fileName, publisher: "", version: "" };
}
