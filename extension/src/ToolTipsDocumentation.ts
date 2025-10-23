import * as fs from "graceful-fs";
import * as path from "path";
import { ALObject, ALControl } from "./ALObject/ALElementTypes";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import { ALControlType, ALObjectType, ALPropertyType } from "./ALObject/Enums";
import { ALPagePart } from "./ALObject/ALPagePart";
import { AppManifest, Settings } from "./Settings/Settings";
import { snakeCase } from "lodash";

export async function generateToolTipDocumentation(
  settings: Settings,
  appManifest: AppManifest,
  objects?: ALObject[]
): Promise<void> {
  if (objects === undefined) {
    objects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
      settings,
      appManifest,
      true,
      false,
      true
    );
  }
  const ignoreTransUnits: string[] =
    settings.ignoreTransUnitInGeneratedDocumentation;

  const text = getToolTipDocumentation(
    settings,
    appManifest,
    objects,
    ignoreTransUnits
  );
  let tooltipDocsFilePathSetting: string = settings.tooltipDocsFilePath;
  let tooltipDocsPath: string;
  let relativePath = true;

  if (tooltipDocsFilePathSetting === "") {
    tooltipDocsFilePathSetting = "ToolTips.md";
  } else {
    if (!tooltipDocsFilePathSetting.endsWith(".md")) {
      throw new Error(
        "The setting NAB.TooltipDocsFilePath must end with a md file name (.md file)."
      );
    }
    relativePath = !path.isAbsolute(tooltipDocsFilePathSetting);
  }

  if (relativePath) {
    tooltipDocsPath = path.normalize(
      path.join(settings.workspaceFolderPath, tooltipDocsFilePathSetting)
    );
  } else {
    tooltipDocsPath = tooltipDocsFilePathSetting;
  }
  if (fs.existsSync(tooltipDocsPath)) {
    fs.unlinkSync(tooltipDocsPath);
  }
  fs.writeFileSync(tooltipDocsPath, text);
}

export function getPagePartText(
  settings: Settings,
  pagePart: ALPagePart,
  skipLink = false
): string {
  let returnText = "";
  const relatedObject = pagePart.relatedObject();
  if (!relatedObject) {
    return "";
  }
  if (getAlControlsToPrint(relatedObject).length === 0) {
    return "";
  }
  let pageType = relatedObject.properties.filter(
    (x) => x.type === ALPropertyType.pageType
  )[0]?.value;
  if (!pageType) {
    pageType = "Card"; // Default PageType
  }
  if (
    !skipDocsForPageType(pageType) &&
    !skipDocsForPageId(
      settings,
      <ALObjectType>relatedObject.objectType,
      <number>relatedObject.objectId
    )
  ) {
    let pageCaption = relatedObject.caption;
    if (!pageCaption) {
      pageCaption = "";
    }
    if (skipLink) {
      returnText = pageCaption;
    } else {
      if (pageCaption !== "") {
        const anchorName = pageCaption
          .replace(/[.()]/g, "")
          .trim()
          .toLowerCase()
          .replace(/ /g, "-");
        returnText = `[${pageCaption}](#${anchorName})`;
      }
    }
  }
  return returnText;
}

export function getToolTipDocumentation(
  settings: Settings,
  appManifest: AppManifest,
  objects: ALObject[],
  ignoreTransUnits?: string[]
): string {
  let docs: string[] = [];
  const title = "Pages Overview";
  const yamlHeader = getYamlHeader(settings, undefined, title, appManifest);
  if (yamlHeader !== "") {
    docs.push(yamlHeader);
  }
  docs.push(`# ${title}`);
  docs.push("");

  let pageObjects = objects.filter(
    (x) =>
      (!x.generatedFromSymbol && x.objectType === ALObjectType.page) ||
      x.objectType === ALObjectType.pageExtension
  );
  pageObjects = pageObjects.sort((a, b) =>
    a.objectName < b.objectName ? -1 : 1
  );
  let pageText: string[] = [];
  let pageExtText: string[] = [];

  pageObjects.forEach((currObject) => {
    const headerText: string[] = [];
    const tableText: string[] = [];
    let addTable = false;
    headerText.push("");
    let skip = false;
    if (currObject.objectType === ALObjectType.pageExtension) {
      if (
        skipDocsForPageId(settings, currObject.objectType, currObject.objectId)
      ) {
        skip = true;
      } else {
        headerText.push(
          "### " + currObject.extendedObjectName?.replace(/\.$/g, "")
        );
      }
    } else {
      let pageType = currObject.properties.find(
        (x) => x.type === ALPropertyType.pageType
      )?.value;
      if (!pageType) {
        pageType = "Card"; // Default PageType
      }
      if (
        currObject.caption === "" ||
        skipDocsForPageType(pageType) ||
        skipDocsForPageId(settings, currObject.objectType, currObject.objectId)
      ) {
        skip = true;
      } else {
        headerText.push("### " + currObject.caption.replace(/\.$/g, ""));
      }
    }
    if (!skip) {
      tableText.push("");
      tableText.push("| Type | Caption | Description |");
      tableText.push("| ----- | --------- | ------- |");
      const controlsToPrint: ALControl[] = getAlControlsToPrint(
        currObject,
        ignoreTransUnits
      );
      controlsToPrint.forEach((control) => {
        const toolTipText = control.toolTip;
        const controlCaption = control.caption.trim();
        const controlTypeText = getControlTypeText(control);
        if (control.type === ALControlType.part) {
          if (getPagePartText(settings, <ALPagePart>control) !== "") {
            tableText.push(
              `| ${controlTypeText} | ${controlCaption} | ${getPagePartText(
                settings,
                <ALPagePart>control
              )} |`
            );
          }
        } else {
          tableText.push(
            `| ${controlTypeText} | ${controlCaption} | ${toolTipText} |`
          );
        }
        addTable = true;
      });

      let currText: string[] = [];

      if (addTable) {
        currText = currText.concat(headerText);
        if (addTable) {
          currText = currText.concat(tableText);
        }

        if (currObject.objectType === ALObjectType.page) {
          pageText = pageText.concat(currText);
        }
        if (currObject.objectType === ALObjectType.pageExtension) {
          pageExtText = pageExtText.concat(currText);
        }
      }
    }
  });
  let gotPages = false;
  if (pageText.length > 0) {
    docs.push("## Pages");
    docs = docs.concat(pageText);
    gotPages = true;
  }
  if (pageExtText.length > 0) {
    if (gotPages) {
      docs.push("");
    }
    docs.push("## Page Extensions");
    docs = docs.concat(pageExtText);
  }
  let text = "";
  docs.forEach((line) => {
    text += line + "\r\n";
  });
  return text;
}

function getControlTypeText(control: ALControl): string {
  let controlTypeText = "";
  switch (control.type) {
    case ALControlType.part:
      controlTypeText = "Sub page";
      break;
    case ALControlType.pageField:
      controlTypeText = "Field";
      break;
    case ALControlType.group:
      controlTypeText = "Group";
      break;
    case ALControlType.systemaction:
    case ALControlType.action:
      controlTypeText = "Action";
      break;
    case ALControlType.area:
      controlTypeText = "Action Group";
      break;
    case ALControlType.label:
      controlTypeText = "Label";
      break;
    default:
      throw new Error(`Unsupported ToolTip Control: ${control.type}`);
  }
  return controlTypeText;
}

export function getAlControlsToPrint(
  currObject: ALObject,
  ignoreTransUnits?: string[]
): ALControl[] {
  const controlsToPrint: ALControl[] = [];
  const allControls = currObject.getAllControls();
  let controls = allControls.filter(
    (control) =>
      (control.toolTip !== "" || control.type === ALControlType.part) &&
      control.type !== ALControlType.modifiedPageField
  );
  if (ignoreTransUnits !== undefined) {
    controls = controls.filter(
      (control) =>
        control.multiLanguageObjects.length === 0 ||
        ignoreTransUnits.indexOf(control.multiLanguageObjects[0].xliffId()) ===
          -1
    );
  }
  controls.sort((a, b) => {
    if (a.type === b.type) {
      return 0;
    }
    return Object.values(ALControlType).indexOf(a.type) <
      Object.values(ALControlType).indexOf(b.type)
      ? -1
      : 1;
  });
  controls.forEach((control) => {
    if (control.caption.trim().length > 0) {
      controlsToPrint.push(control);
    }
  });
  return controlsToPrint;
}

function skipDocsForPageType(pageType: string): boolean {
  return [
    "",
    "API",
    "ConfirmationDialog",
    "HeadlinePart",
    "NavigatePage",
    "ReportPreview",
    "ReportProcessingOnly",
    "RoleCenter",
    "StandardDialog",
    "XmlPort",
  ].includes(pageType);
}

function skipDocsForPageId(
  settings: Settings,
  objectType: ALObjectType,
  objectId: number
): boolean {
  switch (objectType) {
    case ALObjectType.pageExtension: {
      const toolTipDocsIgnorePageExtensionIds: number[] =
        settings.tooltipDocsIgnorePageExtensionIds;
      return toolTipDocsIgnorePageExtensionIds.includes(objectId);
    }
    case ALObjectType.page: {
      const toolTipDocsIgnorePageIds: number[] =
        settings.tooltipDocsIgnorePageIds;
      return toolTipDocsIgnorePageIds.includes(objectId);
    }
    default:
      return false;
  }
}
export function getYamlHeader(
  settings: Settings,
  uid: string | undefined,
  title: string | undefined,
  appManifest: AppManifest
): string {
  const createUid: boolean = settings.createUidForDocs && uid !== undefined;
  if (title) {
    title = addAffixToTitle(title, settings, appManifest);
  }
  if (!createUid && title === undefined) {
    return "";
  }
  let headerValue = "---\n";
  if (createUid) {
    headerValue += `uid: ${snakeCase(uid)}\n`; // snake_case since it's being selected on double-click in VSCode
  }
  if (title !== undefined) {
    headerValue += `title: ${title}\n`;
  }
  headerValue += "---\n";
  return headerValue;
}

function addAffixToTitle(
  title: string,
  settings: Settings,
  appManifest: AppManifest
): string | undefined {
  if (!settings.documentationYamlTitleEnabled) {
    return undefined;
  }
  const prefix = replaceAffixTokens(
    settings.documentationYamlTitlePrefix,
    appManifest
  );
  const suffix = replaceAffixTokens(
    settings.documentationYamlTitleSuffix,
    appManifest
  );
  return `${prefix}${title}${suffix}`;
}
function replaceAffixTokens(title: string, appManifest: AppManifest): string {
  return title
    .replace("{appName}", appManifest.name)
    .replace("{publisher}", appManifest.publisher)
    .replace("{version}", appManifest.version);
}
