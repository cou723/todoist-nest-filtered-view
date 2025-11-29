import { Stack, Text, Title } from "@mantine/core";
import { PanelWrapper } from "../PanelWrapper";

export function DatedGoalsPanel() {
	return (
		<PanelWrapper data-testid="dated-goals-panel">
			<Stack gap="md">
				<Title order={3}>日付付きゴール</Title>
				<Text c="dimmed">Dated goals panel will be implemented here</Text>
			</Stack>
		</PanelWrapper>
	);
}
