import type { TodoistRequestError } from "@doist/todoist-api-typescript";
import { compareAsc } from "date-fns";
import { Effect } from "effect";
import type { TaskRepository } from "@/features/tasks/__application/taskRepository";
import type { DatedGoalTask } from "@/features/tasks/_domain/datedGoalTask";
import type { Task } from "@/features/tasks/_domain/task";

export const DATED_GOAL_FILTER = "@goal & !no date";

const hasDeadline = (task: Task): task is Task & { deadline: Date } =>
	task.deadline instanceof Date;

const sortByDeadline = (a: DatedGoalTask, b: DatedGoalTask): number => {
	const dateOrder = compareAsc(a.deadline, b.deadline);
	if (dateOrder !== 0) {
		return dateOrder;
	}
	return a.order - b.order;
};

interface FetchDatedGoalTasksDeps {
	readonly taskRepository: Pick<TaskRepository, "getAll">;
}

export const fetchDatedGoalTasks = (
	{ taskRepository }: FetchDatedGoalTasksDeps,
): Effect.Effect<DatedGoalTask[], TodoistRequestError> =>
	Effect.gen(function* () {
		const tasks = yield* taskRepository.getAll(DATED_GOAL_FILTER);
		const datedGoals = tasks
			.filter(hasDeadline)
			.map((task) => ({
				id: task.id,
				summary: task.summary,
				deadline: task.deadline,
				order: task.order,
			}));

		return datedGoals.sort(sortByDeadline);
	});
