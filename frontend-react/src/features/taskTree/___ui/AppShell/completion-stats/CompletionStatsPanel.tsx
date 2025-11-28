import { Stack, Text, Title } from "@mantine/core";
import { PanelWrapper } from "../../../../../_olds/shared/components/PanelWrapper";

export function CompletionStatsPanel() {
	return (
		<PanelWrapper data-testid="completion-stats-panel">
			<Stack gap="md">
				<Title order={3}>完了統計</Title>
				<Text c="dimmed">Completion stats panel will be implemented here</Text>
			</Stack>
		</PanelWrapper>
	);
}
