import type { Task } from "@doist/todoist-api-typescript";

export interface TaskWithParent extends Task {
  parentTask?: {
    id: string;
    name: string;
  };
  grandparentTask?: {
    id: string;
    name: string;
  };
}

export interface Project {
  id: string;
  name: string;
}
