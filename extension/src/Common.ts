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

export function mkDirByPathSync(targetDir: string): string {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : "";
  const baseDir = ".";

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

export function formatToday(): string {
  const d = new Date();
  let month: string = (d.getMonth() + 1).toString();
  let day: string = d.getDate().toString();
  const year: string = d.getFullYear().toString();

  if (month.length < 2) {
    month = "0" + month;
  }
  if (day.length < 2) {
    day = "0" + day;
  }

  return [year, month, day].join("-");
}

export function createFolderIfNotExist(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    mkDirByPathSync(folderPath);
  }
}
