import { Paper, Stack, Text, Title } from "@mantine/core";

export function CompletionStatsPanel() {
	return (
		<Paper
			p="md"
			withBorder
			shadow="sm"
			data-testid="completion-stats-panel"
			h="100%"
		>
			<Stack gap="md">
				<Title order={3}>完了統計</Title>
				<Text c="dimmed">Completion stats panel will be implemented here</Text>
			</Stack>
		</Paper>
	);
}
