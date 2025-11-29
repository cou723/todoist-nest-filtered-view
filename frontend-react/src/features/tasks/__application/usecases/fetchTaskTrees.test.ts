import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { Task } from "../../_domain/task";
import type { TaskRepository } from "../taskRepository";
import { fetchTaskTrees } from "./fetchTaskTrees";

const createTaskRepository = (tasks: Task[]): TaskRepository => ({
	getAll: () => Effect.succeed(tasks),
	complete: () => Effect.succeed(undefined),
});

describe("refreshTaskTrees", () => {
	it("builds parent chains and sorts by priority then hierarchy order", async () => {
		const tasks: Task[] = [
			{
				id: "1",
				summary: "Root B (P3)",
				labels: [],
				deadline: null,
				priority: 3,
				parentId: null,
				order: 2,
			},
			{
				id: "2",
				summary: "Child B-1 (P3)",
				labels: [],
				deadline: null,
				priority: 3,
				parentId: "1",
				order: 3,
			},
			{
				id: "3",
				summary: "Root A (P4)",
				labels: [],
				deadline: null,
				priority: 4,
				parentId: null,
				order: 1,
			},
			{
				id: "4",
				summary: "Child A-1 (P4)",
				labels: [],
				deadline: null,
				priority: 4,
				parentId: "3",
				order: 2,
			},
		];

		const result = await Effect.runPromise(
			fetchTaskTrees("", {
				taskRepository: createTaskRepository(tasks),
			}),
		);

		expect(result.map((task) => task.id)).toEqual(["3", "4", "1", "2"]);
		expect(result.find((task) => task.id === "2")?.parent?.id).toBe("1");
	});

	it("sorts siblings by parent order when priorities are equal", async () => {
		const tasks: Task[] = [
			{
				id: "10",
				summary: "Root with later order",
				labels: [],
				deadline: null,
				priority: 2,
				parentId: null,
				order: 5,
			},
			{
				id: "11",
				summary: "Root with earlier order",
				labels: [],
				deadline: null,
				priority: 2,
				parentId: null,
				order: 1,
			},
			{
				id: "12",
				summary: "Child of later root",
				labels: [],
				deadline: null,
				priority: 2,
				parentId: "10",
				order: 3,
			},
		];

		const result = await Effect.runPromise(
			fetchTaskTrees("", {
				taskRepository: createTaskRepository(tasks),
			}),
		);

		expect(result.map((task) => task.id)).toEqual(["11", "10", "12"]);
		expect(result.find((task) => task.id === "12")?.parent?.id).toBe("10");
	});

	it("keeps parent chain even when the parent is filtered out from display", async () => {
		const root: Task = {
			id: "parent",
			summary: "Root task",
			labels: [],
			deadline: null,
			priority: 3,
			parentId: null,
			order: 1,
		};
		const child: Task = {
			id: "child",
			summary: "Child task",
			labels: [],
			deadline: null,
			priority: 3,
			parentId: "parent",
			order: 2,
		};

		const taskRepository: TaskRepository = {
			getAll: (requestedFilter: string) =>
				requestedFilter.trim().length > 0
					? Effect.succeed([child])
					: Effect.succeed([root, child]),
			complete: () => Effect.succeed(undefined),
		};

		const result = await Effect.runPromise(
			fetchTaskTrees("today", { taskRepository }),
		);

		expect(result.map((task) => task.id)).toEqual(["child"]);
		expect(result[0]?.parent?.id).toBe("parent");
	});
});
