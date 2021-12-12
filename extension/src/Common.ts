import * as fs from "fs";
import * as path from "path";

export function replaceAll(
  text: string,
  searchFor: string | RegExp,
  replaceValue: string
): string {
  const re = new RegExp(searchFor, "g");
  return text.replace(re, replaceValue);
}

export function trimAndRemoveQuotes(text: string): string {
  text = text
    .trim()
    .toString()
    .replace(/^"(.+(?="$))"$/, "$1");
  text = text
    .trim()
    .toString()
    .replace(/^'(.+(?='$))'$/, "$1");
  return text;
}

export function escapeRegex(text: string): string {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function convertLinefeedToBR(text: string): string {
  return text.replace(/\n/g, "<br>");
}

export function deleteFolderRecursive(directoryPath: string): void {
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

/**
 *
 * @param date Default Today
 * @returns YYYY-MM-DD
 */
export function formatDate(date = new Date()): string {
  let month: string = (date.getMonth() + 1).toString();
  let day: string = date.getDate().toString();
  const year: string = date.getFullYear().toString();

  month = month.length < 2 ? `0${month}` : month;
  day = day.length < 2 ? `0${day}` : day;

  return `${year}-${month}-${day}`;
}
