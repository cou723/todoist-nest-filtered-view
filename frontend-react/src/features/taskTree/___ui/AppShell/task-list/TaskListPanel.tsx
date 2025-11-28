import { Stack, Text, Title } from "@mantine/core";
import { PanelWrapper } from "../PanelWrapper";

export function TaskListPanel() {
	return (
		<PanelWrapper data-testid="task-list-panel">
			<Stack gap="md">
				<Title order={3}>タスク一覧</Title>
				<Text c="dimmed">Task list panel will be implemented here</Text>
			</Stack>
		</PanelWrapper>
	);
}
