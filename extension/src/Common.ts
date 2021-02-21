import * as fs from 'fs';
import * as path from 'path';

export function replaceAll(text: string, searchFor: string | RegExp, replaceValue: string): string {
  var re = new RegExp(searchFor, 'g');
  return text.replace(re, replaceValue);
}

export function TrimAndRemoveQuotes(text: string): string {
  return text.trim().toString().replace(/^"(.+(?="$))"$/, '$1');
}

export function escapeRegex(text: string) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function convertLinefeedToBR(text: string): string {
  return text.replace(/\n/g, '<br>');
}

export function deleteFolderRecursive(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

