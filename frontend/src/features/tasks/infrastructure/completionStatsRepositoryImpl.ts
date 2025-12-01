import {
	type GetCompletedTasksResponse,
	TodoistApi,
	TodoistRequestError,
	type Task as TodoistTask,
} from "@doist/todoist-api-typescript";
import {
	addDays,
	differenceInCalendarDays,
	formatISO,
	isValid,
	parseISO,
} from "date-fns";
import { Effect } from "effect";
import type { CompletionStatsRepository } from "@/features/tasks/application";
import { CompletionStatsRepositoryError } from "@/features/tasks/application";
import type { CompletedTask } from "@/features/tasks/domain";

const DEFAULT_LIMIT = 100;
// Todoist API の completed by completion date は一度に取得できる期間が ~30 日程度のため安全側で分割する
const MAX_RANGE_DAYS = 30;

const extractLabels = (content: string): string[] => {
	const labelRegex = /@([^\s@]+)/gu;
	const labels: string[] = [];
	let match: RegExpExecArray | null = labelRegex.exec(content);

	while (match !== null) {
		labels.push(match[1]);
		match = labelRegex.exec(content);
	}

	return labels;
};

const toCompletedTask = (
	task: TodoistTask,
): Effect.Effect<CompletedTask, CompletionStatsRepositoryError> => {
	if (!task.completedAt) {
		return Effect.fail(
			new CompletionStatsRepositoryError("完了日時が取得できませんでした"),
		);
	}

	const completedAt = parseISO(task.completedAt);
	if (!isValid(completedAt)) {
		return Effect.fail(
			new CompletionStatsRepositoryError("完了日時の形式が不正です"),
		);
	}

	const labelsFromContent = extractLabels(task.content);
	const mergedLabels = Array.from(
		new Set([...(task.labels ?? []), ...labelsFromContent]),
	);

	return Effect.succeed({
		id: task.id.toString(),
		content: task.content,
		completedAt,
		labels: mergedLabels,
	});
};

export class CompletionStatsRepositoryImpl
	implements CompletionStatsRepository
{
	private readonly todoistClient: TodoistApi;

	constructor(accessToken: string) {
		this.todoistClient = new TodoistApi(accessToken);
	}

	private fetchCompletedTasksByCompletionDate(params: {
		since: Date;
		until: Date;
		cursor: string | null;
	}): Effect.Effect<GetCompletedTasksResponse, CompletionStatsRepositoryError> {
		return Effect.tryPromise({
			try: () =>
				this.todoistClient.getCompletedTasksByCompletionDate({
					since: formatISO(params.since),
					until: formatISO(params.until),
					cursor: params.cursor,
					limit: DEFAULT_LIMIT,
				}),
			catch: (error) => {
				if (error instanceof TodoistRequestError) {
					return new CompletionStatsRepositoryError(
						error.message,
						error.httpStatusCode,
					);
				}
				throw new CompletionStatsRepositoryError(
					"完了タスクの取得に失敗しました",
				);
			},
		});
	}

	fetchCompletedTasks({
		since,
		until,
	}: {
		since: Date;
		until: Date;
	}): Effect.Effect<CompletedTask[], CompletionStatsRepositoryError> {
		return Effect.gen(this, function* () {
			const deduped = new Map<string, CompletedTask>();

			let rangeStart = since;
			while (rangeStart < until) {
				const rangeEnd = addDays(
					rangeStart,
					Math.min(
						MAX_RANGE_DAYS,
						Math.max(0, differenceInCalendarDays(until, rangeStart)),
					),
				);

				let cursor: string | null = null;
				do {
					const response: GetCompletedTasksResponse =
						yield* this.fetchCompletedTasksByCompletionDate({
							since: rangeStart,
							until: rangeEnd,
							cursor,
						});

					const items = yield* Effect.all(response.items.map(toCompletedTask));
					items.forEach((task: CompletedTask) => {
						deduped.set(task.id, task);
					});
					cursor = response.nextCursor;
				} while (cursor);

				rangeStart = rangeEnd;
			}

			return Array.from(deduped.values());
		});
	}
}
