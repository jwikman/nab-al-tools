export interface ITemplateSettings {
  mappings: IMapping[];
  createXlfLanguages: string[];
  renumberObjects: boolean;
}
export interface IRenameFile {
  path: string;
  match: string;
}

export interface ISearchAndReplace {
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
