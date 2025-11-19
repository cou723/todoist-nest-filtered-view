import { Paper, Stack, Text, Title } from "@mantine/core";

export function GoalRatePanel() {
	return (
		<Paper p="md" withBorder shadow="sm" data-testid="goal-rate-panel" h="100%">
			<Stack gap="md">
				<Title order={3}>ゴール率</Title>
				<Text c="dimmed">Goal rate panel will be implemented here</Text>
			</Stack>
		</Paper>
	);
}
