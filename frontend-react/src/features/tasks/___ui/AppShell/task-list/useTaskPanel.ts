import { Effect } from "effect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/___ui/AuthContext";
import { LocalStorageConfigRepository } from "@/features/config/___infrastructure/localStorageConfigRepository";
import type { TaskPanelConfig } from "@/features/config/_domain/taskPanelConfig";
import { TaskRepositoryImpl } from "@/features/tasks/___infrastructure/taskRepositoryImpl";
import { completeTask } from "@/features/tasks/__application/usecases/completeTask";
import { fetchTaskTrees } from "@/features/tasks/__application/usecases/fetchTaskTrees";
import { loadTaskPanelConfig } from "@/features/tasks/__application/usecases/loadTaskPanelConfig";
import { updateTaskPanelConfig } from "@/features/tasks/__application/usecases/updateTaskPanelConfig";
import type { TaskTreeNode } from "@/features/tasks/_domain/fetchTaskTreesUseCase";

type PanelStatus = "idle" | "loading" | "ready" | "error";

const formatErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}
	return typeof error === "string" ? error : "不明なエラーが発生しました";
};

export function useTaskPanel() {
	const { token } = useAuth();
	if (token === null) {
		throw new Error("useTaskPanelは認証済みの状態でのみ使用できます");
	}
	const taskRepository = useMemo(() => new TaskRepositoryImpl(token), [token]);
	const configRepository = useMemo(
		() => new LocalStorageConfigRepository(localStorage),
		[],
	);

	const [tasks, setTasks] = useState<TaskTreeNode[]>([]);
	const [filter, setFilter] = useState<string>("");
	const [status, setStatus] = useState<PanelStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

	const persistFilter = useCallback(
		(nextConfig: TaskPanelConfig) => {
			updateTaskPanelConfig(nextConfig, { configRepository });
			setFilter(nextConfig.filter);
		},
		[configRepository],
	);

	const runRefresh = useCallback(
		async (appliedFilter: string, shouldAbort?: () => boolean) => {
			if (shouldAbort?.()) {
				return;
			}

			setStatus("loading");
			setError(null);
			try {
				const result = await Effect.runPromise(
					fetchTaskTrees(appliedFilter, { taskRepository }),
				);
				if (shouldAbort?.()) {
					return;
				}
				setTasks(result);
				setStatus("ready");
			} catch (e) {
				if (shouldAbort?.()) {
					return;
				}
				setStatus("error");
				setError(formatErrorMessage(e));
				setTasks([]);
			}
		},
		[taskRepository],
	);

	const refresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await runRefresh(filter);
		} finally {
			setIsRefreshing(false);
		}
	}, [filter, runRefresh]);

	useEffect(() => {
		if (!taskRepository) {
			setTasks([]);
			setStatus("idle");
			return;
		}

		const savedConfig = loadTaskPanelConfig({ configRepository });
		persistFilter(savedConfig);

		let cancelled = false;
		const shouldAbort = () => cancelled;
		const fetchTasks = async () => {
			setIsRefreshing(true);
			await runRefresh(savedConfig.filter, shouldAbort);
			if (!cancelled) {
				setIsRefreshing(false);
			}
		};

		void fetchTasks();

		return () => {
			cancelled = true;
		};
	}, [configRepository, persistFilter, runRefresh, taskRepository]);

	const complete = useCallback(
		async (taskId: string) => {
			if (!taskRepository) {
				return;
			}
			setCompletingIds((prev) => new Set(prev).add(taskId));
			try {
				await Effect.runPromise(
					completeTask(taskId, {
						taskRepository,
					}),
				);
				setTasks((prev) => prev.filter((task) => task.id !== taskId));
			} catch (e) {
				setError(formatErrorMessage(e));
				setStatus("error");
			} finally {
				setCompletingIds((prev) => {
					const next = new Set(prev);
					next.delete(taskId);
					return next;
				});
			}
		},
		[taskRepository],
	);

	return {
		tasks,
		filter,
		status,
		error,
		isRefreshing,
		completingIds,
		refresh,
		complete,
	};
}
