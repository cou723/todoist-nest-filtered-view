/**
 * StatsService - 完了統計を取得するサービス
 *
 * このサービスは、完了済みタスクの取得と統計の計算を処理します。
 */

import {
	type GetCompletedTasksByCompletionDateArgs,
	type GetCompletedTasksResponse,
	TodoistApi,
	TodoistRequestError,
} from "@doist/todoist-api-typescript";
import { addDays, format, startOfDay, subDays } from "date-fns";
import { Context, Effect, Layer } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { mapHttpError, NetworkError, ParseError } from "../errors/types";
import {
	CompletedTask,
	DailyCompletionStat,
	extractLabelsFromContent,
	isDailyTask,
	isMilestoneTask,
	isWorkTask,
	TodayTaskStat,
} from "./schema";

/**
 * StatsService インターフェース
 */
export interface IStatsService {
	/**
	 * 日付範囲で完了済みタスクを取得
	 * @param since 開始日 (ISO 8601)
	 * @param until 終了日 (ISO 8601)
	 * @returns 完了済みタスクの配列
	 */
	readonly getCompletedTasks: (
		token: string,
		since?: string,
		until?: string,
	) => Effect.Effect<CompletedTask[], TodoistErrorType>;

	/**
	 * 完了済み作業タスクを取得（毎日のタスクを除外）
	 * @param since 開始日 (ISO 8601)
	 * @param until 終了日 (ISO 8601)
	 * @returns 完了済み作業タスクの配列
	 */
	readonly getCompletedWorkTasks: (
		token: string,
		since?: string,
		until?: string,
	) => Effect.Effect<CompletedTask[], TodoistErrorType>;

	/**
	 * 今日のタスク統計を取得
	 * @returns 今日の完了統計
	 */
	readonly getTodayStats: (
		token: string,
	) => Effect.Effect<TodayTaskStat, TodoistErrorType>;

	/**
	 * 日付範囲の日次完了統計を取得
	 * @param days 取得する日数（デフォルト 90）
	 * @returns 日次統計の配列
	 */
	readonly getDailyStats: (
		token: string,
		days?: number,
	) => Effect.Effect<DailyCompletionStat[], TodoistErrorType>;
}

export class StatsService extends Context.Tag("StatsService")<
	StatsService,
	IStatsService
>() {}

const MAX_WINDOW_DAYS = 90;

const buildCompletedTasksArgs = (
	since: string,
	until: string,
	cursor?: string,
): GetCompletedTasksByCompletionDateArgs => ({
	since,
	until,
	cursor: cursor ?? null,
	limit: 50,
});

const callCompletedByDate = (
	token: string,
	args: GetCompletedTasksByCompletionDateArgs,
): Effect.Effect<GetCompletedTasksResponse, TodoistErrorType> =>
	Effect.tryPromise({
		try: async () => {
			const api = new TodoistApi(token);
			return await api.getCompletedTasksByCompletionDate(args);
		},
		catch: (error) => {
			if (error instanceof TodoistRequestError) {
				const status = error.httpStatusCode ?? 500;
				const message = error.message || "Todoist API エラー";

				return mapHttpError(status, message, error.responseData);
			}

			return new NetworkError({
				message: "完了済みタスクの取得に失敗しました",
				cause: error,
			});
		},
	});

// ヘルパー関数: API レスポンスをデコードして CompletedTask に変換
const decodeAndEnrichCompletedTasks = (
	response: GetCompletedTasksResponse,
): Effect.Effect<{ tasks: CompletedTask[]; nextCursor?: string }, ParseError> =>
	Effect.gen(function* () {
		const result = yield* Effect.try({
			try: () => {
				const tasks = response.items.map((item) => {
					if (!item.completedAt) {
						throw new Error("completedAt が存在しません");
					}

					const labels = extractLabelsFromContent(item.content);

					return new CompletedTask({
						id: item.id,
						completedAt: item.completedAt,
						content: item.content,
						projectId: item.projectId,
						userId: item.userId,
						labels,
					});
				});

				return {
					tasks,
					nextCursor: response.nextCursor ?? undefined,
				};
			},
			catch: (error) =>
				new ParseError({
					message: "完了タスクレスポンスの解析に失敗しました",
					cause: error,
				}),
		});

		return result;
	});

export const StatsServiceLive = Layer.effect(
	StatsService,
	Effect.gen(function* () {
		const fetchChunk = (
			token: string,
			args: GetCompletedTasksByCompletionDateArgs,
		): Effect.Effect<
			{ tasks: CompletedTask[]; nextCursor?: string },
			TodoistErrorType
		> =>
			Effect.gen(function* () {
				const response = yield* callCompletedByDate(token, args);
				return yield* decodeAndEnrichCompletedTasks(response);
			});

		const getCompletedTasks = (
			token: string,
			since?: string,
			until?: string,
		): Effect.Effect<CompletedTask[], TodoistErrorType> =>
			Effect.gen(function* () {
				if (!since || !until) {
					return yield* Effect.fail(
						new ParseError({
							message: "since と until は必須です",
							cause: new Error("Invalid date range"),
						}),
					);
				}

				const allItems: CompletedTask[] = [];
				let cursor: string | undefined;

				do {
					const args = buildCompletedTasksArgs(since, until, cursor);
					const { tasks, nextCursor } = yield* fetchChunk(token, args);

					allItems.push(...tasks);
					cursor = nextCursor;
				} while (cursor);

				return allItems;
			});

		const getCompletedWorkTasks = (
			token: string,
			since?: string,
			until?: string,
		): Effect.Effect<CompletedTask[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allTasks = yield* getCompletedTasks(token, since, until);

				return allTasks.filter((task) => {
					if (isDailyTask(task)) return false;
					return isWorkTask(task) || isMilestoneTask(task.content);
				});
			});

		const getTodayStats = (
			token: string,
		): Effect.Effect<TodayTaskStat, TodoistErrorType> =>
			Effect.gen(function* () {
				const today = new Date();
				const todayKey = format(today, "yyyy-MM-dd");

				const todayStart = startOfDay(today);
				const tomorrowStart = startOfDay(addDays(today, 1));

				const completedTasks = yield* getCompletedWorkTasks(
					token,
					todayStart.toISOString(),
					tomorrowStart.toISOString(),
				);

				return new TodayTaskStat({
					date: todayKey,
					completedCount: completedTasks.length,
					displayDate: today.toLocaleDateString("ja-JP", {
						month: "numeric",
						day: "numeric",
					}),
				});
			});

		const getDailyStats = (
			token: string,
			days = 90,
		): Effect.Effect<DailyCompletionStat[], TodoistErrorType> =>
			Effect.gen(function* () {
				const endDate = new Date();
				const startDate = subDays(endDate, days);

				const untilExclusiveAll = startOfDay(addDays(endDate, 1));
				let remaining = days;
				let untilExclusive = untilExclusiveAll;
				const allCompletedTasks: CompletedTask[] = [];

				while (remaining > 0) {
					const chunkDays = Math.min(MAX_WINDOW_DAYS, remaining);
					const sinceInclusive = subDays(untilExclusive, chunkDays);

					const chunk = yield* getCompletedWorkTasks(
						token,
						sinceInclusive.toISOString(),
						untilExclusive.toISOString(),
					);

					allCompletedTasks.push(...chunk);

					untilExclusive = sinceInclusive;
					remaining -= chunkDays;
				}

				const dailyMap = new Map<string, number>();

				for (const task of allCompletedTasks) {
					const completedDate = new Date(task.completedAt);
					const dateKey = format(completedDate, "yyyy-MM-dd");
					dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
				}

				const result: DailyCompletionStat[] = [];
				for (let i = 0; i < days; i++) {
					const date = addDays(startDate, i);
					const dateKey = format(date, "yyyy-MM-dd");

					result.push(
						new DailyCompletionStat({
							date: dateKey,
							count: dailyMap.get(dateKey) || 0,
							displayDate: date.toLocaleDateString("ja-JP", {
								month: "numeric",
								day: "numeric",
							}),
						}),
					);
				}

				return result;
			});

		return StatsService.of({
			getCompletedTasks,
			getCompletedWorkTasks,
			getTodayStats,
			getDailyStats,
		});
	}),
);
