import * as uuid from "uuid";
import { existsSync, readFileSync } from "fs";

export class TemplateSettings implements ITemplateSettings {
  mappings: IMapping[];
  createXlfLanguages: string[];
  renumberObjects: boolean;
  templateSettingsPath: string;
  constructor(templateSettingsPath: string) {
    this.templateSettingsPath = templateSettingsPath;
    if (!existsSync(templateSettingsPath)) {
      throw new Error(`Could not find file: "${this.templateSettingsPath}"`);
    }
    const templateSettings = JSON.parse(
      readFileSync(this.templateSettingsPath, "utf8")
    ) as ITemplateSettings;

    this.mappings = templateSettings.mappings;
    this.createXlfLanguages = templateSettings.createXlfLanguages;
    this.renumberObjects = templateSettings.renumberObjects;
  }

  public setDefaults(): void {
    for (let i = 0; i < this.mappings.length; i++) {
      const mapping = this.mappings[i];
      mapping.id = i;
      mapping.value = this.getDefaultValue(mapping.default);
    }
  }
  private getDefaultValue(defaultValue: string): string {
    if (defaultValue === "") {
      return "";
    }
    return defaultValue.replace(/\$\(guid\)/gi, uuid.v4());
  }
}

interface ITemplateSettings {
  mappings: IMapping[];
  createXlfLanguages: string[];
  renumberObjects: boolean;
}
interface IRenameFile {
  path: string;
  match: string;
}

interface ISearchAndReplace {
  path: string;
  match: string;
}

export interface IMapping {
  id: number | undefined;
  description: string;
  example: string;
  default: string;
  value: string | undefined;
  renameFile: IRenameFile[];
  searchAndReplace: ISearchAndReplace[];
}
