import { Effect } from "effect";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/ui";
import type { CompletionStatsConfig } from "@/features/config/domain";
import { LocalStorageConfigRepository } from "@/features/config/infrastructure";
import {
	fetchCompletionStats,
	fetchRemainingWorkTasks,
	loadCompletionStatsConfig,
} from "@/features/tasks/application";
import type { CompletionStats } from "@/features/tasks/domain";
import {
	CompletionStatsRepositoryImpl,
	TaskRepositoryImpl,
} from "@/features/tasks/infrastructure";

type PanelStatus = "idle" | "loading" | "ready" | "error";

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
		taskRepository,
		configLoaded,
	]);

	return {
		stats,
		remainingCount,
		status,
		error,
	};
}
