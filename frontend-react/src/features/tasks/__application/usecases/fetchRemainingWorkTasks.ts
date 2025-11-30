import type { TodoistRequestError } from "@doist/todoist-api-typescript";
import { Effect } from "effect";
import type { TaskRepository } from "../taskRepository";

const EXCLUDED_LABEL_ALWAYS = "毎日のタスク";
const normalizeLabel = (label: string) => label.trim().replace(/^@+/, "");

interface FetchRemainingWorkTasksDeps {
	readonly taskRepository: Pick<TaskRepository, "getAll">;
}

export const fetchRemainingWorkTasks = (
	excludedLabels: string[],
	{ taskRepository }: FetchRemainingWorkTasksDeps,
): Effect.Effect<number, TodoistRequestError> =>
	Effect.gen(function* () {
		const excluded = new Set(
			[
				EXCLUDED_LABEL_ALWAYS,
				...excludedLabels
					.map(normalizeLabel)
					.filter((label) => label.length > 0),
			].map(normalizeLabel),
		);

		const tasks = yield* taskRepository.getAll("@task");
		const remaining = tasks.filter(
			(task) =>
				!task.labels.some((label) => excluded.has(normalizeLabel(label))),
		);
		return remaining.length;
	});
