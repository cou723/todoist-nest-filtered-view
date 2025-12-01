import { addHours, startOfToday, subDays } from "date-fns";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	CompletionStatsRepository,
	CompletionStatsRepositoryError,
} from "@/features/tasks/application";
import { fetchCompletionStats } from "@/features/tasks/application";
import type { CompletedTask } from "@/features/tasks/domain";

class StubCompletionStatsRepository implements CompletionStatsRepository {
	private readonly tasks: CompletedTask[];

	constructor(tasks: CompletedTask[]) {
		this.tasks = tasks;
	}

	fetchCompletedTasks(_params: {
		since: Date;
		until: Date;
	}): Effect.Effect<CompletedTask[], CompletionStatsRepositoryError> {
		return Effect.succeed(this.tasks);
	}
}

const makeTask = (
	daysAgo: number,
	labels: string[],
	content = "work task",
): CompletedTask => {
	const todayStart = startOfToday();
	return {
		id: `task-${daysAgo}-${content}`,
		content,
		completedAt: addHours(subDays(todayStart, daysAgo), 9),
		labels,
	};
};

describe("fetchCompletionStats", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-31T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("集計と除外条件を適用する", async () => {
		const tasks: CompletedTask[] = [
			makeTask(0, ["task"]),
			makeTask(0, ["task"]),
			makeTask(1, ["task"]),
			makeTask(2, ["task"], "backlog"),
			makeTask(2, ["task"], "backlog-2"),
			makeTask(2, ["task"], "backlog-3"),
			makeTask(5, ["毎日のタスク"]),
			makeTask(10, ["skip"]),
			makeTask(20, [], "大きな案件のマイルストーンを置く"),
			makeTask(32, ["task"], "prefetch-range"),
			makeTask(40, ["task"], "out-of-range"),
		];

		const repository = new StubCompletionStatsRepository(tasks);
		const result = await Effect.runPromise(
			fetchCompletionStats(["skip"], { completionStatsRepository: repository }),
		);

		expect(result.summary.todayCount).toBe(2);
		expect(result.summary.last90DaysTotal).toBe(7);
		expect(result.summary.last7DaysTotal).toBe(6);
		expect(result.summary.last7DaysAverage).toBeCloseTo(6 / 7, 5);

		const todayPoint = result.daily[result.daily.length - 1];
		expect(todayPoint.count).toBe(2);
		expect(todayPoint.movingAverage).toBeCloseTo(6 / 7, 5);
	});
});
