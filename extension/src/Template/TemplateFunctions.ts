import { ITemplateSettings } from "./TemplateTypes";
import * as uuid from "uuid";

export function setDefaults(templateSettings: ITemplateSettings): void {
  for (let i = 0; i < templateSettings.mappings.length; i++) {
    const mapping = templateSettings.mappings[i];
    mapping.id = i;
    mapping.value = getDefaultValue(mapping.default);
  }
}
function getDefaultValue(defaultValue: string): string {
  if (defaultValue === "") {
    return "";
  }
  return defaultValue.replace(/\$\(guid\)/gi, uuid.v4());
}
