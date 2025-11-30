import { Anchor, Badge, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { PanelWrapper } from "@/features/tasks/ui/AppShell/PanelWrapper";
import { formatDeadlineDisplay } from "@/features/tasks/ui/AppShell/dated-goals/deadlineDisplay";
import { useDatedGoalsPanel } from "@/features/tasks/ui/AppShell/dated-goals/useDatedGoalsPanel";

const taskUrl = (taskId: string) => `https://todoist.com/showTask?id=${taskId}`;

export function DatedGoalsPanel() {
	const { tasks, status, error } = useDatedGoalsPanel();
	const isLoading = status === "loading";

	return (
		<PanelWrapper data-testid="dated-goals-panel">
			<Stack gap="md">
				<Title order={3}>日付付きゴール</Title>

				{error ? (
					<Text c="red" size="sm">
						{error}
					</Text>
				) : null}

				{isLoading ? (
					<Group gap="xs">
						<Loader size="sm" />
						<Text c="dimmed" size="sm">
							読み込み中...
						</Text>
					</Group>
				) : null}

				<Stack gap="xs">
					{tasks.map((task) => {
						const deadlineDisplay = formatDeadlineDisplay(task.deadline);
						return (
							<Group key={task.id} justify="space-between" align="center">
								<Anchor
									href={taskUrl(task.id)}
									target="_blank"
									rel="noreferrer"
									fw={600}
								>
									{task.summary}
								</Anchor>

								<Badge variant="light" color={deadlineDisplay.color}>
									{deadlineDisplay.label}
								</Badge>
							</Group>
						);
					})}
				</Stack>
			</Stack>
		</PanelWrapper>
	);
}
