import { TemplateSettings } from "./TemplateTypes";

export function validateData(templateSettings: TemplateSettings): void {
  for (const mapping of templateSettings.mappings) {
    if (mapping.value === "") {
      throw new Error(`You must provide a value for ${mapping.description}`);
    }
  }
}
