import { Effect } from "effect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../auth/___ui/AuthContext";
import { LocalStorageConfigRepository } from "../../../../config/___infrastructure/localStorageConfigRepository";
import type { CompletionStatsConfig } from "../../../../config/_domain/completionStatsConfig";
import { CompletionStatsRepositoryImpl } from "../../../___infrastructure/completionStatsRepositoryImpl";
import { TaskRepositoryImpl } from "../../../___infrastructure/taskRepositoryImpl";
import { fetchCompletionStats } from "../../../__application/usecases/fetchCompletionStats";
import { fetchRemainingWorkTasks } from "../../../__application/usecases/fetchRemainingWorkTasks";
import { loadCompletionStatsConfig } from "../../../__application/usecases/loadCompletionStatsConfig";
import { updateCompletionStatsConfig } from "../../../__application/usecases/updateCompletionStatsConfig";
import type { CompletionStats } from "../../../_domain/completionStats";

type PanelStatus = "idle" | "loading" | "ready" | "error";

const normalizeExcludedLabels = (labels: string[]): string[] =>
	Array.from(
		new Set(
			labels
				.map((label) => label.trim().replace(/^@+/, ""))
				.filter((label) => label.length > 0),
		),
	);

const formatErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}
	return typeof error === "string" ? error : "不明なエラーが発生しました";
};

export function useCompletionStatsPanel() {
	const { token } = useAuth();
	if (token === null) {
		throw new Error(
			"useCompletionStatsPanelは認証済みの状態でのみ使用できます",
		);
	}

	const completionStatsRepository = useMemo(
		() => new CompletionStatsRepositoryImpl(token),
		[token],
	);
	const taskRepository = useMemo(() => new TaskRepositoryImpl(token), [token]);
	const configRepository = useMemo(
		() => new LocalStorageConfigRepository(localStorage),
		[],
	);

	const [config, setConfig] = useState<CompletionStatsConfig>({
		excludedLabels: [],
	});
	const [configLoaded, setConfigLoaded] = useState(false);
	const [stats, setStats] = useState<CompletionStats | null>(null);
	const [remainingCount, setRemainingCount] = useState<number | null>(null);
	const [status, setStatus] = useState<PanelStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const saved = loadCompletionStatsConfig({ configRepository });
		setConfig(saved);
		setConfigLoaded(true);
	}, [configRepository]);

	useEffect(() => {
		if (!configLoaded) {
			return;
		}

		let cancelled = false;
		const fetchAll = async () => {
			setStatus("loading");
			setError(null);

			try {
				const [statsResult, remainingResult] = await Promise.all([
					Effect.runPromise(
						fetchCompletionStats(config.excludedLabels, {
							completionStatsRepository,
						}),
					),
					Effect.runPromise(
						fetchRemainingWorkTasks(config.excludedLabels, {
							taskRepository,
						}),
					),
				]);

				if (cancelled) {
					return;
				}

				setStats(statsResult);
				setRemainingCount(remainingResult);
				setStatus("ready");
			} catch (e) {
				if (cancelled) {
					return;
				}
				setError(formatErrorMessage(e));
				setStatus("error");
				setStats(null);
				setRemainingCount(null);
			}
		};

		void fetchAll();

		return () => {
			cancelled = true;
		};
	}, [
		completionStatsRepository,
		config.excludedLabels,
		configLoaded,
		taskRepository,
	]);

	const updateExcludedLabels = useCallback(
		(labels: string[]) => {
			const normalized = normalizeExcludedLabels(labels);
			const nextConfig: CompletionStatsConfig = {
				excludedLabels: normalized,
			};
			updateCompletionStatsConfig(nextConfig, { configRepository });
			setConfig(nextConfig);
		},
		[configRepository],
	);

	return {
		stats,
		remainingCount,
		excludedLabels: config.excludedLabels,
		status,
		error,
		updateExcludedLabels,
	};
}
