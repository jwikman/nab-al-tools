export interface WorkspaceFile {
  folders: Folder[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>;
  extensions: Extensions;
}

export interface Extensions {
  recommendations: string[];
}

export interface Folder {
  path: string;
}
