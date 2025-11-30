import { addDays, format, isBefore, startOfToday, subDays } from "date-fns";
import { Effect } from "effect";
import type {
	CompletedTask,
	CompletionStats,
	DailyCompletionCount,
} from "../../_domain/completionStats";
import type {
	CompletionStatsRepository,
	CompletionStatsRepositoryError,
} from "../completionStatsRepository";

const HISTORY_DAYS = 90;
const MOVING_AVERAGE_LOOKBACK = 6;
const EXCLUDED_LABEL_ALWAYS = "毎日のタスク";
const MILESTONE_SUFFIX_PATTERN = /のマイルストーンを置く\s*$/u;

const normalizeLabel = (label: string) => label.trim().replace(/^@+/, "");

const isWorkTask = (task: CompletedTask): boolean => {
	const normalizedLabels = task.labels.map(normalizeLabel);
	return (
		normalizedLabels.includes("task") ||
		MILESTONE_SUFFIX_PATTERN.test(task.content)
	);
};

const isExcluded = (
	task: CompletedTask,
	excludedLabels: Set<string>,
): boolean => {
	return task.labels.some((label) => excludedLabels.has(normalizeLabel(label)));
};

const buildDateKey = (date: Date) => format(date, "yyyy-MM-dd");

const sum = (values: number[]) => values.reduce((acc, cur) => acc + cur, 0);

interface FetchCompletionStatsDeps {
	readonly completionStatsRepository: Pick<
		CompletionStatsRepository,
		"fetchCompletedTasks"
	>;
}

export const fetchCompletionStats = (
	excludedLabels: string[],
	{ completionStatsRepository }: FetchCompletionStatsDeps,
): Effect.Effect<CompletionStats, CompletionStatsRepositoryError> =>
	Effect.gen(function* () {
		const today = startOfToday();
		const startDate = subDays(today, HISTORY_DAYS + MOVING_AVERAGE_LOOKBACK);
		const untilExclusive = addDays(today, 1);

		const fetched = yield* completionStatsRepository.fetchCompletedTasks({
			since: startDate,
			until: untilExclusive,
		});

		const excludedLabelSet = new Set(
			[
				EXCLUDED_LABEL_ALWAYS,
				...excludedLabels
					.map(normalizeLabel)
					.filter((label) => label.length > 0),
			].map(normalizeLabel),
		);

		const filtered = fetched.filter(
			(task) =>
				isWorkTask(task) &&
				!isExcluded(task, excludedLabelSet) &&
				!isBefore(task.completedAt, startDate) &&
				isBefore(task.completedAt, untilExclusive),
		);

		const counts = new Map<string, number>();
		for (const task of filtered) {
			const key = buildDateKey(task.completedAt);
			const current = counts.get(key) ?? 0;
			counts.set(key, current + 1);
		}

		const totalDays = HISTORY_DAYS + MOVING_AVERAGE_LOOKBACK + 1; // 先頭6日 + 履歴90日 + 当日
		const orderedCounts: number[] = [];
		const orderedDates: Date[] = [];
		for (let i = 0; i < totalDays; i += 1) {
			const date = addDays(startDate, i);
			orderedDates.push(date);
			orderedCounts.push(counts.get(buildDateKey(date)) ?? 0);
		}

		const daily: DailyCompletionCount[] = [];
		for (let i = MOVING_AVERAGE_LOOKBACK; i < orderedCounts.length; i += 1) {
			const windowStart = i - MOVING_AVERAGE_LOOKBACK;
			const window = orderedCounts.slice(windowStart, i + 1);
			const average = sum(window) / window.length;

			daily.push({
				date: orderedDates[i],
				count: orderedCounts[i],
				movingAverage: average,
			});
		}

		const todayCount = daily[daily.length - 1]?.count ?? 0;
		const historyCounts = daily
			.slice(0, HISTORY_DAYS)
			.map((item) => item.count);
		const last90DaysTotal = sum(historyCounts);

		const last7 = daily.slice(-7);
		const last7DaysTotal = sum(last7.map((item) => item.count));
		const last7DaysAverage =
			last7.length > 0 ? last7DaysTotal / last7.length : 0;

		return {
			daily,
			summary: {
				last90DaysTotal,
				last7DaysTotal,
				last7DaysAverage,
				todayCount,
			},
		};
	});
