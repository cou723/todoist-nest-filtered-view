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
import type {
	ParentTask,
	TaskTreeNode,
} from "@/features/tasks/_domain/fetchTaskTreesUseCase";

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

interface TaskListItemProps {
	task: TaskTreeNode;
	onComplete: (taskId: string) => void;
	loading: boolean;
}

export function TaskListItem({ task, onComplete, loading }: TaskListItemProps) {
	const ancestors = buildAncestorChain(task);
	const priority = priorityToMeta(task.priority);

	return (
		<Card withBorder shadow="xs" radius="md" p="md">
			<Stack gap="xs">
				{ancestors.length > 0 ? <ParentTree ancestors={ancestors} /> : null}

				<Group justify="space-between" align="flex-start">
					<Stack gap={4} flex={1}>
						<TaskTitle task={task} />
						<TaskMeta priority={priority} task={task} />
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

function TaskMeta({
	priority,
	task,
}: {
	priority: { label: string; color: MantineColor };
	task: TaskTreeNode;
}) {
	return (
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
			{task.labels.length > 0 ? (
				<Group gap={6}>
					{task.labels.map((label) => (
						<Badge key={label} variant="outline" color="blue">
							@{label}
						</Badge>
					))}
				</Group>
			) : null}
		</Group>
	);
}

function TaskTitle({ task }: { task: TaskTreeNode }) {
	return (
		<Anchor href={taskUrl(task.id)} target="_blank" rel="noreferrer" fw={600}>
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
					href={taskUrl(parent.id)}
					target="_blank"
					rel="noreferrer"
					c="dimmed"
				>
					{parent.summary}
				</Anchor>
			))}
		</Breadcrumbs>
	);
}
