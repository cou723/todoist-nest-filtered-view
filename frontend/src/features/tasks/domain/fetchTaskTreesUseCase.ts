import type { Task } from "@/features/tasks/domain/task";

export type ParentTask = Pick<Task, "id" | "summary" | "order"> & {
	parent: ParentTask | null;
};

export type TaskTreeNode = Omit<Task, "parentId"> & {
	parent: ParentTask | null;
};
