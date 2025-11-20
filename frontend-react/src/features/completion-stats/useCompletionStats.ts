/**
 * useCompletionStats - 完了統計取得用カスタムフック
 *
 * StatsService と React Query を組み合わせて、完了統計データを取得します。
 * 7日移動平均の計算ロジックも含みます。
 */

import { FetchHttpClient } from "@effect/platform";
import { useQuery } from "@tanstack/react-query";
import { Effect, Layer } from "effect";
import { useAuth } from "../../app/AuthContext";
import { NetworkError } from "../../shared/errors/types";
import { TodoistHttpClientLive } from "../../shared/http/client";
import {
	StatsService,
	StatsServiceLive,
} from "../../shared/todoist/StatsService";
import type { DailyCompletionStat } from "../../shared/todoist/schema";

interface CompletionStatsData {
	/** 表示用の日次統計（直近90日分） */
	dailyStats: DailyCompletionStat[];
	/** 7日移動平均の計算用データ（先読み6日を含む97日分） */
	statsForAverage: DailyCompletionStat[];
	/** 表示期間の完了合計件数 */
	totalCount: number;
	/** 7日移動平均データ（グラフ描画用） */
	sevenDayAverages: number[];
}

const VISIBLE_DAYS = 90; // 表示日数
const FETCH_DAYS = VISIBLE_DAYS + 6; // 7日移動平均のために6日先読み

/**
 * 7日移動平均を計算
 * @param statsForAverage 平均計算用のデータ（先読み6日を含む）
 * @param visibleCount 表示対象の日数
 * @returns 各日付における7日移動平均の配列
 */
const calculateSevenDayAverages = (
	statsForAverage: DailyCompletionStat[],
	visibleCount: number,
): number[] => {
	const averages: number[] = [];

	// 可視領域の各日について、その日を含む過去7日間の平均を計算
	for (let i = 0; i < visibleCount; i++) {
		const window = statsForAverage.slice(i, i + 7);
		const sum = window.reduce((s, stat) => s + stat.count, 0);
		const denom = window.length || 1; // データ不足時の安全策
		averages.push(sum / denom);
	}

	return averages;
};

/**
 * 完了統計を取得するカスタムフック
 */
export function useCompletionStats() {
	const { token } = useAuth();

	return useQuery({
		queryKey: ["completion-stats", token],
		queryFn: async (): Promise<CompletionStatsData> => {
			if (!token) {
				throw new Error("認証が必要です");
			}

			// Sync API v9 用の HTTP クライアントを作成
			const syncHttpClientLayer = TodoistHttpClientLive({
				baseUrl: "https://api.todoist.com/sync/v9",
				token,
			});

			// FetchHttpClient と Stats サービスレイヤーを組み合わせ
			const appLayer = StatsServiceLive.pipe(
				Layer.provide(syncHttpClientLayer),
				Layer.provide(FetchHttpClient.layer),
			);

			// Effect プログラムを実行
			const statsForAverage = await Effect.runPromise(
				Effect.gen(function* () {
					const statsService = yield* StatsService;
					return yield* statsService.getDailyStats(FETCH_DAYS);
				}).pipe(
					Effect.provide(appLayer),
					Effect.catchAll((error) =>
						Effect.fail(
							new NetworkError({
								message: "完了統計の取得に失敗しました",
								cause: error,
							}),
						),
					),
				),
			);

			// 表示用は直近90日のみ
			const dailyStats = statsForAverage.slice(-VISIBLE_DAYS);

			// 合計件数を計算
			const totalCount = dailyStats.reduce((sum, stat) => sum + stat.count, 0);

			// 7日移動平均を計算
			const sevenDayAverages = calculateSevenDayAverages(
				statsForAverage,
				VISIBLE_DAYS,
			);

			return {
				dailyStats,
				statsForAverage,
				totalCount,
				sevenDayAverages,
			};
		},
		enabled: !!token,
		staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
	});
}

/**
 * 残り@task数を取得するカスタムフック
 */
export function useRemainingTaskCount() {
	const { token } = useAuth();

	return useQuery({
		queryKey: ["remaining-tasks", token],
		queryFn: async (): Promise<number> => {
			if (!token) {
				throw new Error("認証が必要です");
			}

			// Todoist REST API v2 でタスクを取得
			const response = await fetch(
				"https://api.todoist.com/rest/v2/tasks?filter=@task",
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const tasks = await response.json();
			// 未完了タスクのみカウント
			return tasks.filter(
				(task: { is_completed: boolean }) => !task.is_completed,
			).length;
		},
		enabled: !!token,
		staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
	});
}
