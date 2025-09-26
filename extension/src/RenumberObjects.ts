import * as FileFunctions from "./FileFunctions";
import * as CliSettingsLoader from "./Settings/CliSettingsLoader";
import * as fs from "graceful-fs";
import { ALObjectType } from "./ALObject/Enums";
import { getALObjectFromFile } from "./ALObject/ALParser";

export function renumberObjectsInFolder(folderPath: string): number {
  let numberOfChangedObjects = 0;
  const appManifest = CliSettingsLoader.getAppManifest(folderPath);
  const alFiles = FileFunctions.findFiles("**/*.al", folderPath);
  const objectNumbers: Map<ALObjectType, number> = new Map();
  const currentIdRanges: Map<ALObjectType, number> = new Map();
  for (const alFile of alFiles) {
    const alObject = getALObjectFromFile(alFile, false);
    if (alObject) {
      const lastNumber = objectNumbers.get(alObject.objectType);
      let newNumber = 0;
      if (!lastNumber) {
        newNumber = appManifest.idRanges[0].from;
        currentIdRanges.set(alObject.objectType, 0);
      } else {
        newNumber = lastNumber + 1;
        let currentIdRange = currentIdRanges.get(alObject.objectType) || 0;
        if (newNumber > appManifest.idRanges[currentIdRange].to) {
          currentIdRange++;
          if (currentIdRange >= appManifest.idRanges.length) {
            throw new Error(
              "The idRanges in the app.json does not contain enough numbers to renumber all objects."
            );
          }
          currentIdRanges.set(alObject.objectType, currentIdRange);
          newNumber = appManifest.idRanges[currentIdRange].from;
        }
      }
      objectNumbers.set(alObject.objectType, newNumber);
      let content = fs.readFileSync(alFile, { encoding: "utf8" });
      const regex = new RegExp(
        `^(\\s*${alObject.objectType.toString()}\\s+)\\d+(\\s+"?${
          alObject.objectName
        }"?)`,
        "im"
      );
      const oldContent = content;
      content = content.replace(regex, `$1${newNumber}$2`);
      if (content !== oldContent) {
        numberOfChangedObjects++;
      }
      fs.writeFileSync(alFile, content, { encoding: "utf8" });
    }
  }
  return numberOfChangedObjects;
}
