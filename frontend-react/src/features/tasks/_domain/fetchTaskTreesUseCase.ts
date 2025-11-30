import type { Task } from "@/features/tasks/_domain/task";

export type ParentTask = Pick<Task, "id" | "summary" | "order"> & {
	parent: ParentTask | null;
};

export type TaskTreeNode = Omit<Task, "parentId"> & {
	parent: ParentTask | null;
};
