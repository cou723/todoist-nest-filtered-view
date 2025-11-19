import { Text, Title } from "@mantine/core";
import { PanelWrapper } from "../../shared/components/PanelWrapper";

export function DatedGoalsPanel() {
	return (
		<PanelWrapper data-testid="dated-goals-panel">
			<Title order={3}>日付付きゴール</Title>
			<Text c="dimmed">Dated goals panel will be implemented here</Text>
		</PanelWrapper>
	);
}
