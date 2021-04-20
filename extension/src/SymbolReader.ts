import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import * as jdataview from 'jdataview';
import { isNullOrUndefined } from 'util';

// Ref: https://www.npmjs.com/package/adm-zip


export function getSymbolReferenceFromAppFile(appFilePath: string): string {

    //'D:\VSCode\Git\NAB\Spider\App\.alpackages\SmartApps_Spider_18.0.21356.0.app'
    // let rs = new fs.ReadStream();

    let fileContent = fs.readFileSync(appFilePath);
    let view = new jdataview(fileContent);

    // let first = rs.read(32);
    // console.log('First ', first)
    // let second = rs.read(32);
    // console.log('2nd ', second)
    // view.seek(0);
    let magicNumber1 = view.getUint32(0, true);
    let metadataSize = view.getUint32(4, true);
    if (magicNumber1 !== 0x5856414E) {
        throw new Error("Not a valid app file"); // TODO: handle
    }
    // view.seek(metadataSize);
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
    fs.writeFileSync('d:\\temp\\symbol.json', symbolReferenceData); // TODO: Remove

    return symbolReferenceData;
}
