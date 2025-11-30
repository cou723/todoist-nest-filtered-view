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
import { useAuth } from "@/features/auth/___ui/AuthContext";
import { CompletionStatsPanel } from "@/features/tasks/___ui/AppShell/completion-stats/CompletionStatsPanel";
import { DatedGoalsPanel } from "@/features/tasks/___ui/AppShell/dated-goals/DatedGoalsPanel";
import { GoalRatePanel } from "@/features/tasks/___ui/AppShell/goal-rate/GoalRatePanel";
import { ThemeToggle } from "@/features/tasks/___ui/AppShell/ThemeToggle";
import { TaskListPanel } from "@/features/tasks/___ui/AppShell/task-list/TaskListPanel";

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
