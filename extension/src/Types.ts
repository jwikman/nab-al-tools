export type TextDocumentMatch = {
  filePath: string;
  position: number;
  length: number;
};

export interface IOpenXliffIdParam {
  transUnitId: string;
  languageCode: string;
}
