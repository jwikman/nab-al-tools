import { Position, Uri } from "vscode";

export interface TaskRunnerItem {
  description: string;
  command: string;
  arguments?: CommandParameter[];
  openFile?: string;
  taskPath?: string;
  reloadWindow?: boolean;
}

// Allowed arguments types for vscode.commands.executeCommand
type CommandParameter =
  | string
  | boolean
  | number
  | undefined
  | null
  | Position
  | Range
  | Uri
  | Location;
