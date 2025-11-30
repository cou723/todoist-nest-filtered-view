import type { TodoistRequestError } from "@doist/todoist-api-typescript";
import { Effect } from "effect";
import type { TaskRepository } from "@/features/tasks/__application/taskRepository";
import type { GoalRate } from "@/features/tasks/_domain/goalRate";

const normalizeLabel = (label: string) => label.trim().replace(/^@+/, "");

interface FetchGoalRateDeps {
	readonly taskRepository: Pick<TaskRepository, "getAll">;
}

export const fetchGoalRate = ({
	taskRepository,
}: FetchGoalRateDeps): Effect.Effect<GoalRate, TodoistRequestError> =>
	Effect.gen(function* () {
		const tasks = yield* taskRepository.getAll("@goal");

		const goalCount = tasks.length;
		const nonMilestoneCount = tasks.filter((task) =>
			task.labels.some(
				(label) => normalizeLabel(label) === "non-milestone",
			),
		).length;

		const percentage =
			goalCount > 0
				? Math.round((nonMilestoneCount / goalCount) * 100)
				: 0;

		return {
			percentage,
			goalCount,
			nonMilestoneCount,
		};
	});
