import type { Task as Todo } from "@doist/todoist-api-typescript";

export interface TodoNode extends Todo {
  parent?: TodoNode;
}

export interface Project {
  id: string;
  name: string;
}
