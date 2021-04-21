import * as AdmZip from 'adm-zip'; // Ref: https://www.npmjs.com/package/adm-zip
import * as fs from 'fs';
import { isNullOrUndefined } from 'util';
import jDataView = require('jdataview');
import { ALObject } from '../ALObject/ALObject';
import { Property, SymbolReference, Table } from './Interfaces/SymbolReference';
import { ALControlType, ALObjectType } from '../ALObject/Enums';
import { ALTableField } from '../ALObject/ALTableField';
import { ALPropertyTypeMap, MultiLanguageTypeMap } from '../ALObject/Maps';
import { ALProperty } from '../ALObject/ALProperty';
import { MultiLanguageObject } from '../ALObject/MultiLanguageObject';
import { ALControl } from '../ALObject/ALControl';
import * as txml from 'txml';
import { NavxManifest } from './Interfaces/NavxManifest';
import { AppPackage } from './Interfaces/AppPackage';



export function getAppFileContent(appFilePath: string): { symbolReference: string, manifest: string } {

    let symbolReference: string = '';
    let manifest: string = '';
    let fileContent = fs.readFileSync(appFilePath);
    let view = new jDataView(fileContent);

    let magicNumber1 = view.getUint32(0, true);
    let metadataSize = view.getUint32(4, true);
    if (magicNumber1 !== 0x5856414E) {
        throw new Error("Not a valid app file"); // TODO: handle in some way... Just return '{}'
    }

    let dataLength = view.byteLength - metadataSize;

    let buffer = Buffer.from(view.getBytes(dataLength, metadataSize, true));

    let zip = new AdmZip(buffer);

    let zipEntries = zip.getEntries(); // an array of ZipEntry records

    symbolReference = getZipEntryContentOrEmpty(zipEntries, "SymbolReference.json");
    manifest = getZipEntryContentOrEmpty(zipEntries, "NavxManifest.xml");

    return { symbolReference: symbolReference, manifest: manifest }
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
export function getAppPackage(appFilePath: string) {
    let appFileContent = getAppFileContent(appFilePath);
    const symbols = <SymbolReference>JSON.parse(appFileContent.symbolReference);
    // let json = JSON.stringify(txml.simplifyLostLess(txml.parse(appFileContent.manifest) as txml.tNode[]));
    // console.log(json);
    const manifest = <NavxManifest>txml.simplifyLostLess(txml.parse(appFileContent.manifest) as txml.tNode[]);
    let appPackage: AppPackage = { manifest: manifest.Package[0], symbolReference: symbols };
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
    appPackage.objects = objects;
}

export function getObjectsFromAppFile(appFilePath: string) {
    let appPackage = getAppPackage(appFilePath);
    parseObjectsInAppPackage(appPackage);
    return appPackage;
}

function tableToObject(table: Table): ALObject {
    let obj = new ALObject([], ALObjectType.Table, 0, table.Name, table.Id);

    table.Properties?.forEach(prop => {
        addProperty(prop, obj);
    });
    table.Fields.forEach(field => {
        let alField = new ALTableField(ALControlType.TableField, field.Id, field.Name, field.Type);
        field.Properties?.forEach(prop => {
            addProperty(prop, alField);
        });
        obj.controls.push(alField)
    });
    return obj;
}

function addProperty(prop: Property, obj: ALControl) {
    let type = MultiLanguageTypeMap.get(prop.Name.toLowerCase());
    if (type) {
        obj.multiLanguageObjects.push(new MultiLanguageObject(obj, type, prop.Name));
    } else if (ALPropertyTypeMap.has(prop.Name)) {
        obj.properties.push(new ALProperty(obj, 0, prop.Name, prop.Value));
    }
}
