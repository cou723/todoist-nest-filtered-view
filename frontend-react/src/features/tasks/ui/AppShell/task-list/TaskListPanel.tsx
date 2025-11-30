import {
	ActionIcon,
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Group,
	Loader,
	type MantineColor,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { IconCheck, IconRefresh } from "@tabler/icons-react";
import {
	differenceInCalendarDays,
	format,
	isBefore,
	isToday,
	isTomorrow,
} from "date-fns";
import { ja } from "date-fns/locale";
import type { ParentTask, TaskTreeNode } from "@/features/tasks/domain";
import { PanelWrapper } from "@/features/tasks/ui";
import { useTaskPanel } from "./useTaskPanel";

const buildAncestorChain = (task: TaskTreeNode): ParentTask[] => {
	const chain: ParentTask[] = [];
	let current = task.parent;

	while (current) {
		chain.unshift(current);
		current = current.parent;
	}

	return chain;
};

const priorityToMeta = (
	priority: number,
): { label: string; color: MantineColor } => {
	switch (priority) {
		case 4:
			return { label: "緊急/重要", color: "red" };
		case 3:
			return { label: "不急/重要", color: "orange" };
		case 2:
			return { label: "緊急/些末", color: "yellow" };
		default:
			return { label: "不急/些末", color: "gray" };
	}
};

const formatDeadline = (deadline: Date): string => {
	const today = new Date();
	if (isToday(deadline)) {
		return "今日";
	}
	if (isBefore(deadline, today)) {
		const days = Math.abs(differenceInCalendarDays(deadline, today));
		return `${days}日前`;
	}
	if (isTomorrow(deadline)) {
		return "明日";
	}
	const diffDays = differenceInCalendarDays(deadline, today);
	if (diffDays <= 7) {
		return `${diffDays}日後`;
	}
	return format(deadline, "M月d日", { locale: ja });
};

const deadlineTone = (deadline: Date): MantineColor => {
	const today = new Date();
	if (isToday(deadline)) {
		return "orange";
	}
	if (isBefore(deadline, today)) {
		return "red";
	}
	if (isTomorrow(deadline)) {
		return "yellow";
	}
	if (differenceInCalendarDays(deadline, today) <= 3) {
		return "cyan";
	}
	return "gray";
};

const taskUrl = (taskId: string) => `https://todoist.com/showTask?id=${taskId}`;

function TaskListItem({
	task,
	onComplete,
	loading,
}: {
	task: TaskTreeNode;
	onComplete: (taskId: string) => void;
	loading: boolean;
}) {
	const ancestors = buildAncestorChain(task);
	const priority = priorityToMeta(task.priority);

	return (
		<Card withBorder shadow="xs" radius="md" p="md">
			<Stack gap="xs">
				{ancestors.length > 0 ? (
					<Breadcrumbs separator="›" c="dimmed" fz="xs">
						{ancestors.map((parent) => (
							<Anchor
								key={parent.id}
								href={taskUrl(parent.id)}
								target="_blank"
								rel="noreferrer"
								c="dimmed"
							>
								{parent.summary}
							</Anchor>
						))}
					</Breadcrumbs>
				) : null}

				<Group justify="space-between" align="flex-start">
					<Stack gap={4} flex={1}>
						<Anchor
							href={taskUrl(task.id)}
							target="_blank"
							rel="noreferrer"
							fw={600}
						>
							{task.summary}
						</Anchor>

						<Group gap={8}>
							<Badge color={priority.color} variant="light">
								{priority.label}
							</Badge>
							{task.deadline ? (
								<Badge color={deadlineTone(task.deadline)} variant="light">
									📅 {formatDeadline(task.deadline)}
								</Badge>
							) : (
								<Badge color="gray" variant="light">
									期限なし
								</Badge>
							)}
						</Group>

						{task.labels.length > 0 ? (
							<Group gap={6}>
								{task.labels.map((label) => (
									<Badge key={label} variant="outline" color="blue">
										@{label}
									</Badge>
								))}
							</Group>
						) : null}
					</Stack>

					<Tooltip label="タスクを完了にする">
						<Button
							size="xs"
							variant="light"
							color="green"
							leftSection={<IconCheck size={14} />}
							loading={loading}
							onClick={() => onComplete(task.id)}
						>
							完了
						</Button>
					</Tooltip>
				</Group>
			</Stack>
		</Card>
	);
}

export function TaskListPanel() {
	const {
		tasks,
		filter,
		status,
		error,
		isRefreshing,
		completingIds,
		refresh,
		complete,
	} = useTaskPanel();

	const isLoading = status === "loading" && tasks.length === 0;

	return (
		<PanelWrapper data-testid="task-list-panel">
			<Stack gap="md">
				<Group justify="space-between" align="center">
					<div>
						<Title order={3}>タスク一覧</Title>
						<Text size="sm" c="dimmed">
							フィルタ: {filter.trim() ? filter : "（未設定）"}
						</Text>
					</div>

					<Tooltip label="Todoist から最新のタスクを取得">
						<ActionIcon
							variant="light"
							color="blue"
							onClick={refresh}
							aria-label="再読み込み"
							loading={isRefreshing}
						>
							<IconRefresh size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>

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

				{status !== "loading" && tasks.length === 0 && !error ? (
					<Text c="dimmed" size="sm">
						表示できるタスクがありません
					</Text>
				) : null}

				<Stack gap="sm">
					{tasks.map((task) => (
						<TaskListItem
							key={task.id}
							task={task}
							onComplete={complete}
							loading={completingIds.has(task.id)}
						/>
					))}
				</Stack>
			</Stack>
		</PanelWrapper>
	);
}
