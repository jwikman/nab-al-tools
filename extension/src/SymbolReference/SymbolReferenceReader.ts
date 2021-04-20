import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { isNullOrUndefined } from 'util';
import jDataView = require('jdataview');
import { ALObject } from '../ALObject/ALObject';
import { Property, SymbolReference, Table } from './SymbolReference';
import { ALControlType, ALObjectType } from '../ALObject/Enums';
import { ALTableField } from '../ALObject/ALTableField';
import { ALPropertyTypeMap, MultiLanguageTypeMap } from '../ALObject/Maps';
import { ALProperty } from '../ALObject/ALProperty';
import { MultiLanguageObject } from '../ALObject/MultiLanguageObject';
import { ALElement } from '../ALObject/ALElement';
import { ALControl } from '../ALObject/ALControl';

// Ref: https://www.npmjs.com/package/adm-zip


export function getSymbolReferenceFromAppFile(appFilePath: string): string {

    let fileContent = fs.readFileSync(appFilePath);
    let view = new jDataView(fileContent);

    let magicNumber1 = view.getUint32(0, true);
    let metadataSize = view.getUint32(4, true);
    if (magicNumber1 !== 0x5856414E) {
        throw new Error("Not a valid app file"); // TODO: handle in some way... Just return '{}'
    }

    let dataLength = view.byteLength - metadataSize;
    let buffer = new Buffer(view.getBytes(dataLength, metadataSize, true));

    let zip = new AdmZip(buffer);

    let zipEntries = zip.getEntries(); // an array of ZipEntry records

    let symbolReference = zipEntries.filter(zipEntry => zipEntry.name == "SymbolReference.json")[0];
    if (isNullOrUndefined(symbolReference)) {
        throw new Error(`No symbols found in "${path.basename(appFilePath)}"`);
    }
    let symbolReferenceData = symbolReference.getData().toString('utf8');
    if (symbolReferenceData.charCodeAt(0) === 0xFEFF) {
        // Remove BOM
        symbolReferenceData = symbolReferenceData.substr(1);
    }
    // fs.writeFileSync('d:\\temp\\symbol.json', symbolReferenceData); // TODO: Remove

    return symbolReferenceData;
}
export function getObjectsFromAppFile(appFilePath: string) {
    const symbols = <SymbolReference>JSON.parse(getSymbolReferenceFromAppFile(appFilePath));

    let objects: ALObject[] = [];
    symbols.Tables.forEach(table => {
        let obj = tableToObject(table);
        obj.alObjects = objects;
        objects.push(obj);
    });
    return objects;

}

function tableToObject(table: Table): ALObject {
    let obj = new ALObject([], ALObjectType.Table, 0, table.Name, table.Id);
    table.Properties.forEach(prop => {
        addProperty(prop, obj);
    });
    table.Fields.forEach(field => {
        let alField = new ALTableField(ALControlType.TableField, field.Id, field.Name, field.TypeDefinition?.Name || '');
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
