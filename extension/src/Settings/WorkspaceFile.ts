export interface WorkspaceFile {
  folders: Folder[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>;
  extensions: Extensions;
}

interface Extensions {
  recommendations: string[];
}

interface Folder {
  path: string;
}
