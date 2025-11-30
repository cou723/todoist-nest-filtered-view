import { notifications } from "@mantine/notifications";
import { Effect } from "effect";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/___ui/AuthContext";
import { TaskRepositoryImpl } from "@/features/tasks/___infrastructure/taskRepositoryImpl";
import { fetchGoalRate } from "@/features/tasks/__application/usecases/fetchGoalRate";
import type { GoalRate } from "@/features/tasks/_domain/goalRate";

type PanelStatus = "idle" | "loading" | "ready" | "error";

const formatErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	}
	return typeof error === "string" ? error : "不明なエラーが発生しました";
};

export function useGoalRatePanel() {
	const { token } = useAuth();
	if (token === null) {
		throw new Error("useGoalRatePanelは認証済みの状態でのみ使用できます");
	}

	const taskRepository = useMemo(() => new TaskRepositoryImpl(token), [token]);

	const [goalRate, setGoalRate] = useState<GoalRate | null>(null);
	const [status, setStatus] = useState<PanelStatus>("idle");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadGoalRate = async () => {
			setStatus("loading");
			setError(null);
			setGoalRate(null);

			try {
				const result = await Effect.runPromise(
					fetchGoalRate({ taskRepository }),
				);
				if (cancelled) return;

				setGoalRate(result);
				setStatus("ready");
			} catch (e) {
				if (cancelled) return;

				const message = formatErrorMessage(e);
				setError(message);
				setStatus("error");
				notifications.show({
					title: "ゴール率の取得に失敗しました",
					message,
					color: "red",
				});
			}
		};

		void loadGoalRate();

		return () => {
			cancelled = true;
		};
	}, [taskRepository]);

	return {
		goalRate,
		status,
		error,
	};
}
