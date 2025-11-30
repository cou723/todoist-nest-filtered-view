import {
	ActionIcon,
	Group,
	Loader,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { PanelWrapper } from "@/features/tasks/___ui/AppShell/PanelWrapper";
import { TaskListItem } from "@/features/tasks/___ui/AppShell/task-list/TaskListPanel/TaskListItem";
import { useTaskPanel } from "@/features/tasks/___ui/AppShell/task-list/useTaskPanel";

export function TaskListPanel() {
	const {
		tasks,
		filter,
		status,
		error,
		isRefreshing,
		completingIds,
		refresh,
		complete,
	} = useTaskPanel();

	const isLoading = status === "loading" && tasks.length === 0;

	return (
		<PanelWrapper data-testid="task-list-panel">
			<Stack gap="md">
				<Group justify="space-between" align="center">
					<div>
						<Title order={3}>タスク一覧</Title>
						<Text size="sm" c="dimmed">
							フィルタ: {filter.trim() ? filter : "（未設定）"}
						</Text>
					</div>

					<Tooltip label="Todoist から最新のタスクを取得">
						<ActionIcon
							variant="light"
							color="blue"
							onClick={refresh}
							aria-label="再読み込み"
							loading={isRefreshing}
						>
							<IconRefresh size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>

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

				{status !== "loading" && tasks.length === 0 && !error ? (
					<Text c="dimmed" size="sm">
						表示できるタスクがありません
					</Text>
				) : null}

				<Stack gap="sm">
					{tasks.map((task) => (
						<TaskListItem
							key={task.id}
							task={task}
							onComplete={complete}
							loading={completingIds.has(task.id)}
						/>
					))}
				</Stack>
			</Stack>
		</PanelWrapper>
	);
}
