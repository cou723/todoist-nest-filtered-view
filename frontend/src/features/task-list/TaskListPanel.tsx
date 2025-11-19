import { Paper, Stack, Text, Title } from "@mantine/core";

export function TaskListPanel() {
	return (
		<Paper p="md" withBorder shadow="sm" data-testid="task-list-panel" h="100%">
			<Stack gap="md">
				<Title order={3}>タスク一覧</Title>
				<Text c="dimmed">Task list panel will be implemented here</Text>
			</Stack>
		</Paper>
	);
}
