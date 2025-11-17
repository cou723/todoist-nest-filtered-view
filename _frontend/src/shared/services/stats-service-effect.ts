/**
 * StatsService - Effect-based statistics and analytics service
 * 
 * Provides Effect-based methods for retrieving completion statistics and analytics.
 */

import { Effect } from "effect";
import {
  CompletedTasksResponseSchema,
  type CompletedTaskItem,
  type DailyCompletionStat,
  type TodayTaskStat,
} from "../todoist/schema.js";
import { get } from "../http/client.js";
import type { TodoistErrorUnion } from "../errors/todoist-errors.js";
import { format, startOfDay, subDays, addDays } from "date-fns";

/**
 * StatsService interface
 */
export interface StatsService {
  /**
   * Get completed tasks within a date range
   */
  readonly getCompletedTasks: (
    since: string,
    until: string
  ) => Effect.Effect<CompletedTaskItem[], TodoistErrorUnion, never>;
  
  /**
   * Get daily completion statistics for the specified number of days
   */
  readonly getDailyCompletionStats: (
    days: number
  ) => Effect.Effect<DailyCompletionStat[], TodoistErrorUnion, never>;
  
  /**
   * Get today's task statistics
   */
  readonly getTodayStats: () => Effect.Effect<TodayTaskStat, TodoistErrorUnion, never>;
}

/**
 * StatsService configuration
 */
export interface StatsServiceConfig {
  readonly proxyUrl: string;
  readonly accessToken: string;
}

/**
 * Helper to check if a task should be counted in statistics
 */
const shouldCountTask = (content: string): boolean => {
  // Exclude daily tasks
  if (content.includes("@毎日のタスク")) {
    return false;
  }
  
  // Include @task or milestone tasks
  return content.includes("@task") || content.endsWith("のマイルストーンを置く");
};

/**
 * Create StatsService implementation
 */
export const makeStatsService = (config: StatsServiceConfig): StatsService => {
  /**
   * Fetch all completed tasks with pagination
   */
  const fetchAllCompletedTasks = (
    since: string,
    until: string
  ): Effect.Effect<CompletedTaskItem[], TodoistErrorUnion, never> => {
    return Effect.gen(function* () {
      const allTasks: CompletedTaskItem[] = [];
      let cursor: string | null = null;
      
      do {
        const params: Record<string, string | undefined> = {
          since,
          until,
          cursor: cursor ?? undefined,
          limit: "50",
        };
        
        const response = yield* get(
          config.proxyUrl,
          "/v1/tasks/completed/by_completion_date",
          CompletedTasksResponseSchema,
          params,
          config.accessToken
        );
        
        allTasks.push(...response.items);
        cursor = response.next_cursor;
      } while (cursor !== null);
      
      return allTasks;
    });
  };
  
  /**
   * Get daily completion statistics
   */
  const getDailyStats = (days: number): Effect.Effect<DailyCompletionStat[], TodoistErrorUnion, never> => {
    return Effect.gen(function* () {
      const endDate = new Date();
      
      // API v1 has a 90-day limit per request
      const MAX_WINDOW_DAYS = 90;
      const untilExclusiveAll = startOfDay(addDays(endDate, 1));
      let remaining = days;
      let untilExclusive = untilExclusiveAll;
      const completedTasks: CompletedTaskItem[] = [];
      
      // Fetch in chunks if needed
      while (remaining > 0) {
        const chunkDays = Math.min(MAX_WINDOW_DAYS, remaining);
        const sinceInclusive = subDays(untilExclusive, chunkDays);
        
        const chunk = yield* fetchAllCompletedTasks(
          sinceInclusive.toISOString(),
          untilExclusive.toISOString()
        );
        
        completedTasks.push(...chunk);
        untilExclusive = sinceInclusive;
        remaining -= chunkDays;
      }
      
      // Filter tasks
      const filteredTasks = completedTasks.filter((task) =>
        shouldCountTask(task.content)
      );
      
      // Group by date and count
      const countByDate = new Map<string, number>();
      for (const task of filteredTasks) {
        const completedDate = new Date(task.completed_at);
        const dateKey = format(completedDate, "yyyy-MM-dd");
        countByDate.set(dateKey, (countByDate.get(dateKey) || 0) + 1);
      }
      
      // Generate stats for all days in range
      const stats: DailyCompletionStat[] = [];
      for (let i = 0; i < days; i++) {
        const date = subDays(endDate, days - i - 1);
        const dateKey = format(date, "yyyy-MM-dd");
        
        stats.push({
          date: dateKey,
          count: countByDate.get(dateKey) || 0,
          displayDate: format(date, "M/d"),
        });
      }
      
      return stats;
    });
  };
  
  return {
    getCompletedTasks: fetchAllCompletedTasks,
    getDailyCompletionStats: getDailyStats,
    getTodayStats: () =>
      Effect.gen(function* () {
        const today = new Date();
        const todayKey = format(today, "yyyy-MM-dd");
        const tomorrowStart = startOfDay(addDays(today, 1));
        
        const tasks = yield* fetchAllCompletedTasks(
          startOfDay(today).toISOString(),
          tomorrowStart.toISOString()
        );
        
        const filteredTasks = tasks.filter((task) =>
          shouldCountTask(task.content)
        );
        
        return {
          date: todayKey,
          completedCount: filteredTasks.length,
          displayDate: "今日",
        };
      }),
  };
};
