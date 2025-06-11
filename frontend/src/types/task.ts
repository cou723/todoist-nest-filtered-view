import type { Task } from "@doist/todoist-api-typescript";

export interface TaskNode extends Task {
  parent?: TaskNode;
}

export interface Project {
  id: string;
  name: string;
}
