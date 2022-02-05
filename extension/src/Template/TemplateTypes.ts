import * as uuid from "uuid";
import { existsSync, readFileSync } from "fs";

export class TemplateSettings implements ITemplateSettings {
  templateSettingsPath = "";
  mappings: IMapping[];
  createXlfLanguages: string[];
  renumberObjects = true;

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
}
interface IRenameFiles {
  path: string;
  match: string;
  removeSpaces: boolean;
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
}

export interface IMappingMessage {
  text: string;
  rowId: string;
  newValue: string;
}
