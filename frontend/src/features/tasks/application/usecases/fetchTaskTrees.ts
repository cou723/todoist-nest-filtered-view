import type { TodoistRequestError } from "@doist/todoist-api-typescript";
import { Effect } from "effect";
import type { TaskRepository } from "@/features/tasks/application";
import type { ParentTask, Task, TaskTreeNode } from "@/features/tasks/domain";

interface fetchTaskTreesDeps {
	readonly taskRepository: Pick<TaskRepository, "getAll">;
}

export function fetchTaskTrees(
	filter: string,
	{ taskRepository }: fetchTaskTreesDeps,
): Effect.Effect<TaskTreeNode[], TodoistRequestError> {
	const trimmedFilter = filter.trim();

	return Effect.gen(function* () {
		const allTasks = yield* taskRepository.getAll("");
		const tasksToDisplay =
			trimmedFilter.length > 0
				? yield* taskRepository.getAll(trimmedFilter)
				: allTasks;

		const taskTrees = buildTaskTrees(allTasks);
		const displayTaskIds = new Set(tasksToDisplay.map((task) => task.id));

		return sortTaskTrees(
			taskTrees.filter((task) => displayTaskIds.has(task.id)),
		);
	});
}

const buildTaskTrees = (tasks: Task[]): TaskTreeNode[] => {
	const taskMap = new Map(tasks.map((task) => [task.id, task]));
	const cache = new Map<string, TaskTreeNode>();

	const buildNode = (task: Task): TaskTreeNode => {
		const cached = cache.get(task.id);
		if (cached) {
			return cached;
		}

		const parentTask = task.parentId ? taskMap.get(task.parentId) : null;
		const parentNode: ParentTask | null = parentTask
			? buildNode(parentTask)
			: null;
		const node: TaskTreeNode = {
			...task,
			parent: parentNode,
		};
		cache.set(task.id, node);
		return node;
	};

	return tasks.map((task) => buildNode(task));
};

const sortTaskTrees = (tasks: TaskTreeNode[]): TaskTreeNode[] => {
	return [...tasks].sort((a, b) => {
		if (a.priority !== b.priority) {
			return b.priority - a.priority;
		}
		return compareHierarchically(a, b);
	});
};

const compareHierarchically = (a: TaskTreeNode, b: TaskTreeNode): number => {
	const ancestorsA = buildAncestorChain(a);
	const ancestorsB = buildAncestorChain(b);

	const minLength = Math.min(ancestorsA.length, ancestorsB.length);

	for (let i = 0; i < minLength; i += 1) {
		const ancestorA = ancestorsA[i];
		const ancestorB = ancestorsB[i];

		if (ancestorA.id === ancestorB.id) {
			continue;
		}

		return ancestorA.order - ancestorB.order;
	}

	if (ancestorsA.length !== ancestorsB.length) {
		return ancestorsA.length - ancestorsB.length;
	}

	return a.order - b.order;
};

const buildAncestorChain = (task: TaskTreeNode): ParentTask[] => {
	const chain: ParentTask[] = [];
	let current = task.parent;

	while (current) {
		chain.unshift(current);
		current = current.parent;
	}

	chain.push(task);
	return chain;
};
