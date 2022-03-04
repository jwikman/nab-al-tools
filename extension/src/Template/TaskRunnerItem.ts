export interface TaskRunnerItem {
  description: string;
  command: string;
  required: boolean;
  openFile?: string;
  taskPath?: string;
}
