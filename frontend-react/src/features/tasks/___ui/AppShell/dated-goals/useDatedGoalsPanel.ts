import { Effect } from "effect";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/___ui/AuthContext";
import { TaskRepositoryImpl } from "@/features/tasks/___infrastructure/taskRepositoryImpl";
import { fetchDatedGoalTasks } from "@/features/tasks/__application/usecases/fetchDatedGoalTasks";
import type { DatedGoalTask } from "@/features/tasks/_domain/datedGoalTask";

type PanelStatus = "idle" | "loading" | "ready" | "error";

const formatErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}
	return typeof error === "string" ? error : "不明なエラーが発生しました";
};

export function useDatedGoalsPanel() {
	const { token } = useAuth();
	if (token === null) {
		throw new Error("useDatedGoalsPanelは認証済みの状態でのみ使用できます");
	}

	const taskRepository = useMemo(() => new TaskRepositoryImpl(token), [token]);

	const [tasks, setTasks] = useState<DatedGoalTask[]>([]);
	const [status, setStatus] = useState<PanelStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const fetchTasks = async () => {
			setStatus("loading");
			setError(null);

			try {
				const result = await Effect.runPromise(
					fetchDatedGoalTasks({
						taskRepository,
					}),
				);

				if (cancelled) {
					return;
				}

				setTasks(result);
				setStatus("ready");
			} catch (e) {
				if (cancelled) {
					return;
				}
				setError(formatErrorMessage(e));
				setStatus("error");
				setTasks([]);
			}
		};

		void fetchTasks();

		return () => {
			cancelled = true;
		};
	}, [taskRepository]);

	return {
		tasks,
		status,
		error,
	};
}
