import type { Task } from "@doist/todoist-api-typescript";

export interface TaskWithParent extends Task {
  parentTaskName?: string;
  grandparentTaskName?: string;
}

export interface Project {
  id: string;
  name: string;
}
