import {
	Button,
	Container,
	Flex,
	Grid,
	Group,
	Loader,
	AppShell as MantineAppShell,
	Title,
} from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { LoginForm } from "../features/auth/LoginForm";
import { CompletionStatsPanel } from "../features/completion-stats/CompletionStatsPanel";
import { DatedGoalsPanel } from "../features/dated-goals/DatedGoalsPanel";
import { GoalRatePanel } from "../features/goal-rate/GoalRatePanel";
import { TaskListPanel } from "../features/task-list/TaskListPanel";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { useAuth } from "./AuthContext";

export function AppShell() {
	const { isAuthenticated, isLoading, login, logout } = useAuth();

	// 読み込み中の表示
	if (isLoading) {
		return (
			<Container
				size="xl"
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
				}}
			>
				<Loader size="lg" />
			</Container>
		);
	}

	// 未認証時はログインフォームのみ表示
	if (!isAuthenticated) {
		return <LoginForm onLogin={login} />;
	}

	// 認証済みの場合は通常のアプリケーションを表示
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
