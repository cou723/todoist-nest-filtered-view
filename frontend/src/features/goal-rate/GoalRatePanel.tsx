import { Stack, Text, Title } from "@mantine/core";
import { PanelWrapper } from "../../shared/components/PanelWrapper";

export function GoalRatePanel() {
	return (
		<PanelWrapper data-testid="goal-rate-panel">
			<Stack gap="md">
				<Title order={3}>ゴール率</Title>
				<Text c="dimmed">Goal rate panel will be implemented here</Text>
			</Stack>
		</PanelWrapper>
	);
}
