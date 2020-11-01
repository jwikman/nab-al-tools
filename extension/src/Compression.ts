import * as zlib from 'zlib';
import {createReadStream, createWriteStream} from 'fs';

export const createGzip = zlib.createGzip();
export const createGunzip = zlib.createGunzip();

/**
 * @description Compress file as gzip.
 * @param filename path of file to be compressed.
 */
export function compressFile(filename: string) {
    let newFilename = filename + ".gz";
    let writeStream = createWriteStream(newFilename);
    let readStream = createReadStream(filename)
    readStream.pipe(createGzip).pipe(writeStream);
}

/**
 * @description Decompress file as gzip.
 * @param filename path of file to be decompressed.
 */
export function decompressFile(filename: string) {
    let newFilename = filename.replace(".gz", "");
    let writeStream = createWriteStream(newFilename);
    createReadStream(filename).pipe(createGunzip).pipe(writeStream);
}
