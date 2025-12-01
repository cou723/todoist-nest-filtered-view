import { Group, Loader, Stack, Text, Title } from "@mantine/core";
import { PanelWrapper } from "@/features/tasks/ui";
import { useGoalRatePanel } from "./useGoalRatePanel";

export function GoalRatePanel() {
	const { goalRate, status } = useGoalRatePanel();

	const isLoading = status === "loading";
	const hasGoalTasks = (goalRate?.goalCount ?? 0) > 0;

	return (
		<PanelWrapper data-testid="goal-rate-panel">
			<Stack gap="md">
				<Title order={3}>非マイルストーンゴールTodo率</Title>

				{isLoading ? (
					<Group gap="xs">
						<Loader size="sm" />
						<Text c="dimmed" size="sm">
							読み込み中...
						</Text>
					</Group>
				) : null}

				{status === "error" ? (
					<Text c="red" size="sm">
						読み込みに失敗しました
					</Text>
				) : null}

				{status === "ready" && goalRate ? (
					hasGoalTasks ? (
						<Stack gap={4} align="center">
							<Text fz={40} fw={800}>
								{goalRate.percentage}%
							</Text>
							<Text c="dimmed">@non-milestone タスクの割合</Text>
							<Text c="dimmed" size="sm">
								{goalRate.nonMilestoneCount} / {goalRate.goalCount} タスク
							</Text>
						</Stack>
					) : (
						<Text c="dimmed" size="sm">
							@goal タスクがありません
						</Text>
					)
				) : null}
			</Stack>
		</PanelWrapper>
	);
}
