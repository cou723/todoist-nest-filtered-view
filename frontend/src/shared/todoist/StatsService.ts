/**
 * StatsService - Service for fetching completion statistics
 *
 * This service handles fetching completed tasks and calculating statistics.
 */

import { Schema as S } from "@effect/schema";
import { addDays, format, startOfDay, subDays } from "date-fns";
import { Context, Effect, Layer } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { ParseError } from "../errors/types";
import { TodoistHttpClient } from "../http/client";
import {
	CompletedTask,
	CompletedTasksResponse,
	DailyCompletionStat,
	extractLabelsFromContent,
	isDailyTask,
	isMilestoneTask,
	isWorkTask,
	TodayTaskStat,
} from "./schema";

/**
 * StatsService interface
 */
export interface IStatsService {
	/**
	 * Fetch completed tasks by date range
	 * @param since Start date (ISO 8601)
	 * @param until End date (ISO 8601)
	 * @returns Array of completed tasks
	 */
	readonly getCompletedTasks: (
		since?: string,
		until?: string,
	) => Effect.Effect<CompletedTask[], TodoistErrorType>;

	/**
	 * Fetch completed work tasks (excludes daily tasks)
	 * @param since Start date (ISO 8601)
	 * @param until End date (ISO 8601)
	 * @returns Array of completed work tasks
	 */
	readonly getCompletedWorkTasks: (
		since?: string,
		until?: string,
	) => Effect.Effect<CompletedTask[], TodoistErrorType>;

	/**
	 * Get today's task statistics
	 * @returns Today's completion stats
	 */
	readonly getTodayStats: () => Effect.Effect<TodayTaskStat, TodoistErrorType>;

	/**
	 * Get daily completion statistics for a date range
	 * @param days Number of days to fetch (default 90)
	 * @returns Array of daily stats
	 */
	readonly getDailyStats: (
		days?: number,
	) => Effect.Effect<DailyCompletionStat[], TodoistErrorType>;
}

/**
 * StatsService Tag
 */
export class StatsService extends Context.Tag("StatsService")<
	StatsService,
	IStatsService
>() {}

/**
 * Maximum date range for v1 API (90 days)
 */
const MAX_WINDOW_DAYS = 90;

/**
 * Create StatsService layer
 */
export const StatsServiceLive = Layer.effect(
	StatsService,
	Effect.gen(function* () {
		const httpClient = yield* TodoistHttpClient;

		/**
		 * Fetch completed tasks with pagination
		 */
		const getCompletedTasks = (
			since?: string,
			until?: string,
		): Effect.Effect<CompletedTask[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allItems: CompletedTask[] = [];
				let cursor: string | undefined;

				do {
					const params = new URLSearchParams();
					if (since) params.set("since", since);
					if (until) params.set("until", until);
					if (cursor) params.set("cursor", cursor);
					params.set("limit", "50"); // API default max per page

					const url = `/v1/tasks/completed/by_completion_date?${params.toString()}`;

					const response = yield* httpClient.get(url);

					// Parse response structure
					const parsed = yield* Effect.try({
						try: () => {
							const data = response as {
								items?: unknown[];
								next_cursor?: string | null;
							};
							return {
								items: data.items ?? [],
								nextCursor: data.next_cursor ?? null,
							};
						},
						catch: (error) =>
							new ParseError({
								message: "完了タスクレスポンスの解析に失敗しました",
								cause: error,
							}),
					});

					// Decode using schema
					const validated = yield* S.decodeUnknown(CompletedTasksResponse)(
						parsed,
					).pipe(
						Effect.mapError(
							(error) =>
								new ParseError({
									message: "完了タスクのバリデーションに失敗しました",
									cause: error,
								}),
						),
					);

					// Convert API format to domain format and extract labels
					const enrichedItems = validated.items.map((item) => {
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

					allItems.push(...enrichedItems);
					cursor = validated.nextCursor ?? undefined;
				} while (cursor);

				return allItems;
			});

		/**
		 * Fetch completed work tasks (filters out daily tasks)
		 */
		const getCompletedWorkTasks = (
			since?: string,
			until?: string,
		): Effect.Effect<CompletedTask[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allTasks = yield* getCompletedTasks(since, until);

				// Filter: exclude daily tasks, include work tasks or milestone tasks
				return allTasks.filter((task) => {
					if (isDailyTask(task)) return false;
					return isWorkTask(task) || isMilestoneTask(task.content);
				});
			});

		/**
		 * Get today's task statistics
		 */
		const getTodayStats = (): Effect.Effect<TodayTaskStat, TodoistErrorType> =>
			Effect.gen(function* () {
				const today = new Date();
				const todayKey = format(today, "yyyy-MM-dd");

				// Local time range for today
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

		/**
		 * Get daily completion statistics
		 */
		const getDailyStats = (
			days = 90,
		): Effect.Effect<DailyCompletionStat[], TodoistErrorType> =>
			Effect.gen(function* () {
				const endDate = new Date();
				const startDate = subDays(endDate, days);

				// Split into chunks of max 90 days
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

				// Aggregate by date
				const dailyMap = new Map<string, number>();

				for (const task of allCompletedTasks) {
					const completedDate = new Date(task.completedAt);
					const dateKey = format(completedDate, "yyyy-MM-dd");
					dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
				}

				// Create stats for each day in range
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
