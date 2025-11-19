import { Paper, Stack, Text, Title } from "@mantine/core";

export function DatedGoalsPanel() {
	return (
		<Paper
			p="md"
			withBorder
			shadow="sm"
			data-testid="dated-goals-panel"
			h="100%"
		>
			<Stack gap="md">
				<Title order={3}>日付付きゴール</Title>
				<Text c="dimmed">Dated goals panel will be implemented here</Text>
			</Stack>
		</Paper>
	);
}
