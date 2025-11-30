import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { TaskRepository } from "@/features/tasks/__application/taskRepository";
import {
	DATED_GOAL_FILTER,
	fetchDatedGoalTasks,
} from "@/features/tasks/__application/usecases/fetchDatedGoalTasks";
import type { Task } from "@/features/tasks/_domain/task";

const createTaskRepository = (tasks: Task[]): TaskRepository => ({
	getAll: () => Effect.succeed(tasks),
	complete: () => Effect.succeed(undefined),
});

describe("fetchDatedGoalTasks", () => {
	it("期限昇順で並べ、同日ならorder昇順でソートし、期限なしは除外する", async () => {
		const tasks: Task[] = [
			{
				id: "later-date",
				summary: "Later date",
				labels: ["goal"],
				deadline: new Date("2024-02-02T00:00:00.000Z"),
				priority: 1,
				parentId: null,
				order: 2,
			},
			{
				id: "same-date-high-order",
				summary: "Same date higher order",
				labels: ["goal"],
				deadline: new Date("2024-01-15T00:00:00.000Z"),
				priority: 1,
				parentId: null,
				order: 5,
			},
			{
				id: "same-date-low-order",
				summary: "Same date lower order",
				labels: ["goal"],
				deadline: new Date("2024-01-15T00:00:00.000Z"),
				priority: 1,
				parentId: null,
				order: 1,
			},
			{
				id: "no-deadline",
				summary: "No deadline",
				labels: ["goal"],
				deadline: null,
				priority: 1,
				parentId: null,
				order: 1,
			},
		];

		const result = await Effect.runPromise(
			fetchDatedGoalTasks({
				taskRepository: createTaskRepository(tasks),
			}),
		);

		expect(result.map((task) => task.id)).toEqual([
			"same-date-low-order",
			"same-date-high-order",
			"later-date",
		]);
		expect(result.some((task) => task.id === "no-deadline")).toBe(false);
	});

	it("Todoistフィルタ `@goal & !no date` を使用して取得する", async () => {
		let requestedFilter = "";
		const taskRepository: TaskRepository = {
			getAll: (filter) => {
				requestedFilter = filter;
				return Effect.succeed([]);
			},
			complete: () => Effect.succeed(undefined),
		};

		await Effect.runPromise(fetchDatedGoalTasks({ taskRepository }));

		expect(requestedFilter).toBe(DATED_GOAL_FILTER);
	});
});
