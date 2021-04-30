import * as AdmZip from 'adm-zip'; // Ref: https://www.npmjs.com/package/adm-zip
import * as fs from 'fs';
import * as path from 'path';
import { isNullOrUndefined } from 'util';
import jDataView = require('jdataview');
import { ALObject } from '../ALObject/ALObject';
import { ControlDefinition, ControlKind, PageDefinition, SymbolProperty, SymbolReference, TableDefinition } from './interfaces/SymbolReference';
import { ALControlType, ALObjectType } from '../ALObject/Enums';
import { ALTableField } from '../ALObject/ALTableField';
import { ALPropertyTypeMap, MultiLanguageTypeMap } from '../ALObject/Maps';
import { ALProperty } from '../ALObject/ALProperty';
import { MultiLanguageObject } from '../ALObject/MultiLanguageObject';
import { ALControl } from '../ALObject/ALControl';
import * as txml from 'txml';
import { ManifestPackage, NavxManifest } from './interfaces/NavxManifest';
import { AppPackage } from './types/AppPackage';
import * as SymbolReferenceCache from './SymbolReferenceCache';
import { ALPageField } from '../ALObject/ALPageField';
import { isNumber } from 'lodash';
import { ALPagePart } from '../ALObject/ALPagePart';


export function getAppFileContent(appFilePath: string, loadSymbols: boolean = true): { symbolReference: string, manifest: string, packageId: string } {

    let symbolReference: string = '';
    let manifest: string = '';
    let fileContent = fs.readFileSync(appFilePath);
    let view = new jDataView(fileContent);

    let magicNumber1 = view.getUint32(0, true);
    let metadataSize = view.getUint32(4, true);
    let metadataVersion = view.getUint32(8, true);

    if (magicNumber1 !== 0x5856414E || metadataVersion > 2) {
        throw new Error(`"${appFilePath}" is not a valid app file`);
    }

    let packageIdArray = Buffer.from(view.getBytes(16, 12, true));
    let byteArray: number[] = [];
    packageIdArray.forEach(b => byteArray.push(b));
    let packageId = byteArrayToGuid(byteArray);
    let dataLength = view.byteLength - metadataSize;

    let buffer = Buffer.from(view.getBytes(dataLength, metadataSize, true));

    let zip = new AdmZip(buffer);
    let zipEntries = zip.getEntries(); // an array of ZipEntry records
    if (loadSymbols) {
        symbolReference = getZipEntryContentOrEmpty(zipEntries, "SymbolReference.json");
        symbolReference = symbolReference.replace(/\0/g, ''); // Trailing NULL characters seems to be common...
    }
    manifest = getZipEntryContentOrEmpty(zipEntries, "NavxManifest.xml");

    return { symbolReference: symbolReference, manifest: manifest, packageId: packageId }
}

function byteArrayToGuid(byteArray: number[]): string {
    // reverse first four bytes, and join with following two reversed, joined with following two reversed, joined with rest of the bytes
    byteArray = (byteArray.slice(0, 4).reverse()).concat(byteArray.slice(4, 6).reverse()).concat(byteArray.slice(6, 8).reverse()).concat(byteArray.slice(8));

    let guidValue = byteArray.map(function (item) {
        // return hex value with "0" padding
        return ('00' + item.toString(16).toUpperCase()).substr(-2, 2);
    }).join('');
    guidValue = `${guidValue.substr(0, 8)}-${guidValue.substr(8, 4)}-${guidValue.substr(12, 4)}-${guidValue.substr(16, 4)}-${guidValue.substr(20)}`;
    return guidValue.toLowerCase();
}

function getZipEntryContentOrEmpty(zipEntries: AdmZip.IZipEntry[], fileName: string) {
    let zipEntry = zipEntries.filter(zipEntry => zipEntry.name == fileName)[0];
    if (isNullOrUndefined(zipEntry)) {
        return '';
    }
    let fileContent = zipEntry.getData().toString('utf8');
    if (fileContent.charCodeAt(0) === 0xFEFF) {
        // Remove BOM
        fileContent = fileContent.substr(1);
    }
    return fileContent;
}
export function getAppPackage(appFilePath: string, loadSymbols: boolean = true) {
    let appFileContent = getAppFileContent(appFilePath);
    let symbols: SymbolReference;
    // let json = JSON.stringify(txml.simplifyLostLess(txml.parse(appFileContent.manifest) as txml.tNode[]));
    // console.log(json);
    const manifest: ManifestPackage = (<NavxManifest>txml.simplifyLostLess(txml.parse(appFileContent.manifest) as txml.tNode[])).Package[0];
    let appPackage: AppPackage = new AppPackage(appFilePath, manifest.App[0]._attributes.Name, manifest.App[0]._attributes.Publisher, manifest.App[0]._attributes.Version, appFileContent.packageId, manifest);
    if (loadSymbols) {
        // const debugFolder = path.join(__dirname, '.debug');
        // createFolderIfNotExist(debugFolder);
        // const debugFile = path.join(debugFolder, `${appPackage.packageId}.json`);
        // fs.writeFileSync(debugFile, appFileContent.symbolReference, "utf8");
        // console.log(`Symbol saved. PackageId: ${appPackage.packageId} Name: ${appPackage.name} version: ${appPackage.version}`);
        symbols = <SymbolReference>JSON.parse(appFileContent.symbolReference);
        appPackage.symbolReference = symbols;
    }
    return appPackage;
}



export function getObjectsFromAppFile(appFilePath: string) {
    const { name, publisher, version } = getAppIdentifiersFromFilename(appFilePath);

    let appPackage;
    if (SymbolReferenceCache.appInCache(name, publisher, version)) {
        appPackage = SymbolReferenceCache.getAppPackageFromCache(name, publisher, version);
        if (appPackage) {
            return appPackage;
        }
    }
    appPackage = getAppPackage(appFilePath);
    parseObjectsInAppPackage(appPackage);
    SymbolReferenceCache.addAppPackageToCache(appPackage);
    return appPackage;
}


export function parseObjectsInAppPackage(appPackage: AppPackage) {
    if (isNullOrUndefined(appPackage.symbolReference)) {
        return;
    }
    let objects: ALObject[] = [];
    appPackage.symbolReference.Tables.forEach(table => {
        let obj = tableToObject(table);
        obj.alObjects = objects;
        objects.push(obj);
    });
    appPackage.symbolReference.Pages.forEach(page => {
        let obj = pageToObject(page);
        obj.alObjects = objects;
        if (obj.sourceTable !== '') {
            // Substitute Table No. against Table Name
            const table = objects.filter(tbl => tbl.objectType === ALObjectType.Table && tbl.objectId === Number(obj.sourceTable))[0];
            if (table) {
                obj.sourceTable = table.name;
            }
        }
        objects.push(obj);
    });
    // TODO: Loop ALPageParts and substitute page no. against page names
    appPackage.objects.push(...objects);

}

function tableToObject(table: TableDefinition): ALObject {
    let obj = new ALObject([], ALObjectType.Table, 0, table.Name, table.Id);
    obj.generatedFromSymbol = true;
    table.Properties?.forEach(prop => {
        addProperty(prop, obj);
    });
    table.Fields?.forEach(field => {
        let alField = new ALTableField(ALControlType.TableField, field.Id as number, field.Name, field.TypeDefinition.Name);
        field.Properties?.forEach(prop => {
            addProperty(prop, alField);
        });
        obj.controls.push(alField)
    });
    return obj;
}

function pageToObject(page: PageDefinition): ALObject {
    let obj = new ALObject([], ALObjectType.Page, 0, page.Name, page.Id);
    obj.generatedFromSymbol = true;
    page.Properties?.forEach(prop => {
        addProperty(prop, obj);
    });
    page.Controls?.forEach(control => {
        addControl(control, obj);
    });
    return obj;
}

function addControl(control: ControlDefinition, parent: ALControl) {
    let alControl: ALControl | undefined;
    if (control.Kind === ControlKind.Field) {
        const sourceExpr = control.Properties.filter(prop => prop.Name === 'SourceExpression')[0].Value;
        alControl = new ALPageField(ALControlType.PageField, control.Name, sourceExpr);
    } else if (control.Kind === ControlKind.Part) {
        alControl = new ALPagePart(ALControlType.Part, control.Name, control.RelatedPagePartId?.toString() || '');
    } else {
        let newAlControlType: ALControlType = ALControlType.None;
        switch (control.Kind) {
            case ControlKind.Area:
                newAlControlType = ALControlType.Area;
                break;
            case ControlKind.CueGroup:
                newAlControlType = ALControlType.CueGroup;
                break;
            case ControlKind.Group:
                newAlControlType = ALControlType.Group;
                break;
            case ControlKind.Repeater:
                newAlControlType = ALControlType.Repeater;
                break;
        }
        if (newAlControlType !== ALControlType.None) {
            alControl = new ALControl(newAlControlType, control.Name);
        }
    }
    if (alControl !== undefined) {
        control.Properties?.forEach(prop => {
            if (alControl !== undefined) {
                addProperty(prop, alControl);
            }
        });
        parent.controls.push(alControl)
        control.Controls?.forEach(c => {
            if (alControl !== undefined) {
                addControl(c, alControl)
            }
        })
    }
}

function addProperty(prop: SymbolProperty, obj: ALControl) {
    let type = MultiLanguageTypeMap.get(prop.Name.toLowerCase());
    if (type) {
        let mlProp = new MultiLanguageObject(obj, type, prop.Name);
        mlProp.text = prop.Value;
        obj.multiLanguageObjects.push(mlProp);

    } else if (ALPropertyTypeMap.has(prop.Name.toLowerCase())) {
        obj.properties.push(new ALProperty(obj, 0, prop.Name, prop.Value));
    }
}


export function getAppIdentifiersFromFilename(filePath: string) {
    let fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    fileName = fileName.substr(0, fileName.length - ext.length);
    const appParts = fileName.split('_');
    const name = appParts[1];
    const publisher = appParts[0];
    const version = appParts[2];
    return { name, publisher, version };
}