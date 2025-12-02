import {
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Group,
	type MantineColor,
	Stack,
	Tooltip,
	useComputedColorScheme,
	useMantineTheme,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import {
	differenceInCalendarDays,
	format,
	isBefore,
	isToday,
	isTomorrow,
} from "date-fns";
import { ja } from "date-fns/locale";
import type { ParentTask, TaskTreeNode } from "@/features/tasks/domain";
import {
	openTodoistPreferApp,
	todoistTaskLinks,
} from "@/features/tasks/ui/AppShell/todoistLinks";

const buildAncestorChain = (task: TaskTreeNode): ParentTask[] => {
	const chain: ParentTask[] = [];
	let current = task.parent;

	while (current) {
		chain.unshift(current);

		current = current.parent;
	}

	return chain;
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

interface TaskListItemProps {
	task: TaskTreeNode;
	onComplete: (taskId: string) => void;
	loading: boolean;
}

export function TaskListItem({ task, onComplete, loading }: TaskListItemProps) {
	const ancestors = buildAncestorChain(task);

	return (
		<Card withBorder shadow="xs" radius="md" p="md">
			<Stack gap="xs">
				{ancestors.length > 0 ? <ParentTree ancestors={ancestors} /> : null}

				<Group justify="space-between" align="flex-start">
					<Stack gap={4} flex={1}>
						<TaskTitle task={task} />
						<TaskMeta task={task} />
					</Stack>

					<CompleteButton
						loading={loading}
						onComplete={onComplete}
						task={task}
					/>
				</Group>
			</Stack>
		</Card>
	);
}

function CompleteButton({
	loading,
	onComplete,
	task,
}: {
	loading: boolean;
	onComplete: (taskId: string) => void;
	task: TaskTreeNode;
}) {
	return (
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
	);
}

function TaskMeta({ task }: { task: TaskTreeNode }) {
	const isEmergency = task.priority >= 3;
	const isImportant = task.priority === 4 || task.priority === 2;

	return (
		<Group gap={8}>
			{isEmergency && (
				<Badge color={"red"} variant="light">
					緊急
				</Badge>
			)}
			{isImportant && (
				<Badge color={"blue"} variant="light">
					重要
				</Badge>
			)}
			{task.deadline && (
				<Badge color={deadlineTone(task.deadline)} variant="light">
					📅 {formatDeadline(task.deadline)}
				</Badge>
			)}
			{task.labels.length > 0 &&
				task.labels.map((label) => (
					<Badge key={label} color="gray" variant="light">
						@{label}
					</Badge>
				))}
		</Group>
	);
}

function TaskTitle({ task }: { task: TaskTreeNode }) {
	const colorScheme = useComputedColorScheme("light");
	const theme = useMantineTheme();
	const taskLinks = todoistTaskLinks(task.id);

	return (
		<Anchor
			href={taskLinks.web}
			target="_blank"
			rel="noreferrer"
			fw={700}
			c={colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.dark[4]}
			onClick={(event) => openTodoistPreferApp(event, task.id)}
		>
			{task.summary}
		</Anchor>
	);
}

function ParentTree({ ancestors }: { ancestors: ParentTask[] }) {
	return (
		<Breadcrumbs separator="›" c="dimmed" fz="xs">
			{ancestors.map((parent) => (
				<Anchor
					key={parent.id}
					href={todoistTaskLinks(parent.id).web}
					target="_blank"
					rel="noreferrer"
					c="dimmed"
					onClick={(event) => openTodoistPreferApp(event, parent.id)}
				>
					{parent.summary}
				</Anchor>
			))}
		</Breadcrumbs>
	);
}
