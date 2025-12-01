import {
	Anchor,
	Badge,
	Group,
	Loader,
	Stack,
	Text,
	Title,
	useComputedColorScheme,
	useMantineTheme,
} from "@mantine/core";
import { PanelWrapper } from "@/features/tasks/ui";
import { openTodoistPreferApp, todoistTaskLinks } from "../todoistLinks";
import { formatDeadlineDisplay } from "./deadlineDisplay";
import { useDatedGoalsPanel } from "./useDatedGoalsPanel";

export function DatedGoalsPanel() {
	const colorScheme = useComputedColorScheme("light");
	const theme = useMantineTheme();
	const { tasks, status, error } = useDatedGoalsPanel();
	const isLoading = status === "loading";

	return (
		<PanelWrapper data-testid="dated-goals-panel">
			<Stack gap="md">
				<Title order={3}>日付付きゴール</Title>

				{error ? (
					<Text c="red" size="sm">
						{error}
					</Text>
				) : null}

				{isLoading ? (
					<Group gap="xs">
						<Loader size="sm" />
						<Text c="dimmed" size="sm">
							読み込み中...
						</Text>
					</Group>
				) : null}

				<Stack gap="xs">
					{tasks.map((task) => {
						const taskLinks = todoistTaskLinks(task.id);
						const deadlineDisplay = formatDeadlineDisplay(task.deadline);
						return (
							<Group key={task.id} justify="space-between" align="center">
								<Anchor
									href={taskLinks.web}
									target="_blank"
									rel="noreferrer"
									fw={600}
									c={colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.dark[4]}
									onClick={(event) => openTodoistPreferApp(event, task.id)}
								>
									{task.summary}
								</Anchor>

								<Badge variant="light" color={deadlineDisplay.color}>
									{deadlineDisplay.label}
								</Badge>
							</Group>
						);
					})}
				</Stack>
			</Stack>
		</PanelWrapper>
	);
}
