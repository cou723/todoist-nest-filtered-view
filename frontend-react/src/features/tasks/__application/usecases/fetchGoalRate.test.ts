import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { TaskRepository } from "@/features/tasks/__application/taskRepository";
import { fetchGoalRate } from "@/features/tasks/__application/usecases/fetchGoalRate";
import type { Task } from "@/features/tasks/_domain/task";

const createTaskRepository = (tasks: Task[]): TaskRepository => ({
	getAll: () => Effect.succeed(tasks),
	complete: () => Effect.succeed(undefined),
});

const baseTask: Task = {
	id: "",
	summary: "",
	labels: [],
	deadline: null,
	priority: 1,
	parentId: null,
	order: 1,
};

describe("fetchGoalRate", () => {
	it("calculates percentage based on non-milestone goal tasks", async () => {
		const tasks: Task[] = [
			{
				...baseTask,
				id: "goal-1",
				labels: ["goal", "non-milestone"],
			},
			{
				...baseTask,
				id: "goal-2",
				labels: ["goal"],
			},
			{
				...baseTask,
				id: "goal-3",
				labels: ["@non-milestone", "goal"],
			},
		];

		const result = await Effect.runPromise(
			fetchGoalRate({ taskRepository: createTaskRepository(tasks) }),
		);

		expect(result.goalCount).toBe(3);
		expect(result.nonMilestoneCount).toBe(2);
		expect(result.percentage).toBe(67);
	});

	it("returns 0 percentage when there are no goal tasks", async () => {
		const result = await Effect.runPromise(
			fetchGoalRate({ taskRepository: createTaskRepository([]) }),
		);

		expect(result.goalCount).toBe(0);
		expect(result.nonMilestoneCount).toBe(0);
		expect(result.percentage).toBe(0);
	});
});
