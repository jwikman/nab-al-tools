import * as uuid from "uuid";
import { existsSync, readFileSync } from "fs";
import { TaskRunnerItem } from "./TaskRunnerItem";

export class TemplateSettings implements ITemplateSettings {
  templateSettingsPath = "";
  mappings: IMapping[];
  createXlfLanguages: string[];
  renumberObjects = true;
  postConversionTasks: TaskRunnerItem[] = [];

  public static fromFile(templateSettingsPath: string): TemplateSettings {
    if (!existsSync(templateSettingsPath)) {
      throw new Error(`Could not find file: "${templateSettingsPath}"`);
    }
    const fileContent = readFileSync(templateSettingsPath, "utf8");
    const templateSettings = new TemplateSettings(fileContent);
    templateSettings.templateSettingsPath = templateSettingsPath;
    return templateSettings;
  }

  constructor(templateSettingsJson: string) {
    const templateSettings = JSON.parse(
      templateSettingsJson
    ) as ITemplateSettings;

    this.mappings = templateSettings.mappings;
    this.mappings.forEach((m) => {
      if (m.hidden === undefined) {
        m.hidden = false;
      }
      if (m.hidden && m.default === "") {
        throw new Error(
          `The mapping "${m.description}" is set to hidden, but are missing a default value. Hidden mappings must provide a default value.`
        );
      }
    });
    this.createXlfLanguages = templateSettings.createXlfLanguages;
    if (templateSettings.renumberObjects === false) {
      this.renumberObjects = false;
    }
  }

  public setDefaults(): void {
    for (let i = 0; i < this.mappings.length; i++) {
      const mapping = this.mappings[i];
      mapping.id = i;
      mapping.value = mapping.default.replace(/\$\(guid\)/gi, uuid.v4());
    }
  }
}

interface ITemplateSettings {
  mappings: IMapping[];
  createXlfLanguages: string[];
  renumberObjects: boolean;
  postConversionTasks: TaskRunnerItem[];
}
interface IRenameFiles {
  path: string;
  match: string;
  replaceSpaces: boolean;
  replaceSpacesWith: string;
}

interface IPlaceholderSubstitutions {
  path: string;
  match: string;
}

export interface IMapping {
  id: number | undefined;
  description: string;
  example: string;
  default: string;
  value: string | undefined;
  renameFiles: IRenameFiles[];
  placeholderSubstitutions: IPlaceholderSubstitutions[];
  hidden: boolean;
}

export interface IMappingMessage {
  text: string;
  rowId: string;
  newValue: string;
}
