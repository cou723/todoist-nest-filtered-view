import { Text, Title } from "@mantine/core";
import { PanelWrapper } from "../../shared/components/PanelWrapper";

export function CompletionStatsPanel() {
	return (
		<PanelWrapper data-testid="completion-stats-panel">
			<Title order={3}>完了統計</Title>
			<Text c="dimmed">Completion stats panel will be implemented here</Text>
		</PanelWrapper>
	);
}
