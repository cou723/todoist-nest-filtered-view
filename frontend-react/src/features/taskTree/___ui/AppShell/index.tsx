import {
	Button,
	Container,
	Flex,
	Grid,
	Group,
	AppShell as MantineAppShell,
	Title,
} from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { TaskListPanel } from "./task-list/TaskListPanel";
import { CompletionStatsPanel } from "./completion-stats/CompletionStatsPanel";
import { GoalRatePanel } from "./goal-rate/GoalRatePanel";
import { DatedGoalsPanel } from "./dated-goals/DatedGoalsPanel";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "./AuthContext";

export function AppShell() {
	const { logout } = useAuth();

	return (
		<MantineAppShell header={{ height: 60 }} padding="md">
			<MantineAppShell.Header>
				<Container size="xl" h="100%">
					<Flex justify="space-between" align="center" h="100%">
						<Title order={2}>Todoist Nest Filtered View</Title>
						<Group gap="sm">
							<ThemeToggle />
							<Button
								variant="subtle"
								color="gray"
								leftSection={<IconLogout size={16} />}
								onClick={logout}
							>
								ログアウト
							</Button>
						</Group>
					</Flex>
				</Container>
			</MantineAppShell.Header>

			<MantineAppShell.Main>
				<Container size="xl">
					<Grid gutter="md">
						<Grid.Col span={{ base: 12, md: 6 }}>
							<GoalRatePanel />
						</Grid.Col>
						<Grid.Col span={{ base: 12, md: 6 }}>
							<DatedGoalsPanel />
						</Grid.Col>
						<Grid.Col span={12}>
							<CompletionStatsPanel />
						</Grid.Col>
						<Grid.Col span={12}>
							<TaskListPanel />
						</Grid.Col>
					</Grid>
				</Container>
			</MantineAppShell.Main>
		</MantineAppShell>
	);
}
