import {
	Container,
	Flex,
	Grid,
	Group,
	AppShell as MantineAppShell,
	Title,
} from "@mantine/core";
import { CompletionStatsPanel } from "../features/completion-stats/CompletionStatsPanel";
import { DatedGoalsPanel } from "../features/dated-goals/DatedGoalsPanel";
import { GoalRatePanel } from "../features/goal-rate/GoalRatePanel";
import { TaskListPanel } from "../features/task-list/TaskListPanel";
import { ThemeToggle } from "../shared/components/ThemeToggle";

export function AppShell() {
	return (
		<MantineAppShell header={{ height: 60 }} padding="md">
			<MantineAppShell.Header>
				<Container size="xl" h="100%">
					<Flex justify="space-between" align="center" h="100%">
						<Title order={2}>Todoist Nest Filtered View</Title>
						<Group gap="sm">
							<ThemeToggle />
						</Group>
					</Flex>
				</Container>
			</MantineAppShell.Header>

			<MantineAppShell.Main>
				<Container size="xl">
					<Grid gutter="md">
						{/* First row: Goal Rate and Dated Goals - 2 columns on desktop, 1 on mobile */}
						<Grid.Col span={{ base: 12, md: 6 }}>
							<GoalRatePanel />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<DatedGoalsPanel />
						</Grid.Col>

						{/* Second row: Completion Stats - full width */}
						<Grid.Col span={12}>
							<CompletionStatsPanel />
						</Grid.Col>

						{/* Third row: Task List - full width */}
						<Grid.Col span={12}>
							<TaskListPanel />
						</Grid.Col>
					</Grid>
				</Container>
			</MantineAppShell.Main>
		</MantineAppShell>
	);
}
