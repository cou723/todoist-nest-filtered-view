/**
 * StatsService - 完了統計を取得するサービス
 *
 * このサービスは、完了済みタスクの取得と統計の計算を処理します。
 */

import { Schema as S } from "@effect/schema";
import { addDays, format, startOfDay, subDays } from "date-fns";
import { Context, Effect, Layer } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { ParseError } from "../errors/types";
import { TodoistHttpClient } from "../http/client";
import {
	CompletedTask,
	CompletedTasksApiResponse,
	CompletedTasksResponse,
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
		since?: string,
		until?: string,
	) => Effect.Effect<CompletedTask[], TodoistErrorType>;

	/**
	 * 今日のタスク統計を取得
	 * @returns 今日の完了統計
	 */
	readonly getTodayStats: () => Effect.Effect<TodayTaskStat, TodoistErrorType>;

	/**
	 * 日付範囲の日次完了統計を取得
	 * @param days 取得する日数（デフォルト 90）
	 * @returns 日次統計の配列
	 */
	readonly getDailyStats: (
		days?: number,
	) => Effect.Effect<DailyCompletionStat[], TodoistErrorType>;
}

export class StatsService extends Context.Tag("StatsService")<
	StatsService,
	IStatsService
>() {}

const MAX_WINDOW_DAYS = 90;
const PROXY_BASE = import.meta.env.VITE_PROXY_URL ?? "http://localhost:8000";

// ヘルパー関数: クエリパラメータを構築
const buildCompletedTasksUrl = (
	since?: string,
	until?: string,
	cursor?: string,
): string => {
	const params = new URLSearchParams();
	if (since) params.set("since", since);
	if (until) params.set("until", until);
	if (cursor) params.set("cursor", cursor);
	params.set("limit", "50");
	return `${PROXY_BASE}/v1/tasks/completed/by_completion_date?${params.toString()}`;
};

// ヘルパー関数: API レスポンスをデコードして CompletedTask に変換
const decodeAndEnrichCompletedTasks = (
	response: unknown,
): Effect.Effect<{ tasks: CompletedTask[]; nextCursor?: string }, ParseError> =>
	Effect.gen(function* () {
		const apiResponse = yield* S.decodeUnknown(CompletedTasksApiResponse)(
			response,
		).pipe(
			Effect.mapError(
				(error) =>
					new ParseError({
						message: "完了タスクレスポンスの解析に失敗しました",
						cause: error,
					}),
			),
		);

		const validated = new CompletedTasksResponse({
			items: apiResponse.items ?? [],
			nextCursor: apiResponse.next_cursor ?? null,
		});

		const tasks = validated.items.map((item) => {
			const labels = extractLabelsFromContent(item.content);
			return new CompletedTask({
				id: item.id,
				completedAt: item.completed_at,
				content: item.content,
				projectId: item.project_id,
				userId: item.user_id,
				labels,
			});
		});

		return {
			tasks,
			nextCursor: validated.nextCursor ?? undefined,
		};
	});

export const StatsServiceLive = Layer.effect(
	StatsService,
	Effect.gen(function* () {
		const httpClient = yield* TodoistHttpClient;

		const getCompletedTasks = (
			since?: string,
			until?: string,
		): Effect.Effect<CompletedTask[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allItems: CompletedTask[] = [];
				let cursor: string | undefined;

				do {
					const url = buildCompletedTasksUrl(since, until, cursor);
					const response = yield* httpClient.get(url);
					const { tasks, nextCursor } =
						yield* decodeAndEnrichCompletedTasks(response);

					allItems.push(...tasks);
					cursor = nextCursor;
				} while (cursor);

				return allItems;
			});

		const getCompletedWorkTasks = (
			since?: string,
			until?: string,
		): Effect.Effect<CompletedTask[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allTasks = yield* getCompletedTasks(since, until);

				return allTasks.filter((task) => {
					if (isDailyTask(task)) return false;
					return isWorkTask(task) || isMilestoneTask(task.content);
				});
			});

		const getTodayStats = (): Effect.Effect<TodayTaskStat, TodoistErrorType> =>
			Effect.gen(function* () {
				const today = new Date();
				const todayKey = format(today, "yyyy-MM-dd");

				const todayStart = startOfDay(today);
				const tomorrowStart = startOfDay(addDays(today, 1));

				const completedTasks = yield* getCompletedWorkTasks(
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
