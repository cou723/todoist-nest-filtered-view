/**
 * TaskItem component - displays a single task with parent hierarchy
 */

import {
	ActionIcon,
	Badge,
	Box,
	Checkbox,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { TaskNode } from "../../../shared/todoist/schema";
import { getAncestorChain, getPriorityText } from "../utils/taskUtils";

interface TaskItemProps {
	task: TaskNode;
	onComplete: (taskId: string) => void;
}

export function TaskItem({ task, onComplete }: TaskItemProps) {
	const ancestorChain = getAncestorChain(task);

	const openInTodoist = (taskId: string) => {
		window.open(
			`https://todoist.com/showTask?id=${taskId}`,
			"_blank",
			"noopener,noreferrer",
		);
	};

	const formatDueDate = (due: { date: string }) => {
		try {
			const dueDate = new Date(`${due.date}T00:00:00`);
			return format(dueDate, "M/d (E)", { locale: ja });
		} catch {
			return due.date;
		}
	};

	return (
		<Box
			p="sm"
			style={(theme) => ({
				borderBottom: `1px solid ${theme.colors.gray[3]}`,
				"&:hover": {
					backgroundColor: theme.colors.gray[0],
				},
			})}
		>
			<Group align="flex-start" gap="md">
				<Box style={{ flex: 1 }}>
					<Stack gap="xs">
						{/* Parent hierarchy */}
						{ancestorChain.length > 0 && (
							<Group gap={4}>
								{ancestorChain.map((ancestor, index) => (
									<Group gap={4} key={ancestor.id}>
										<Text
											size="xs"
											c="dimmed"
											style={{ cursor: "pointer" }}
											onClick={() => openInTodoist(ancestor.id)}
											td="underline"
										>
											{ancestor.content}
										</Text>
										{index < ancestorChain.length - 1 && (
											<Text size="xs" c="dimmed">
												{">"}
											</Text>
										)}
									</Group>
								))}
							</Group>
						)}

						{/* Task content */}
						<Group justify="space-between" align="flex-start">
							<Box style={{ flex: 1 }}>
								<Text size="sm" fw={500}>
									{task.content}
								</Text>

								{/* Metadata: priority, due date, labels */}
								<Group gap="xs" mt={4}>
									{task.priority > 1 && (
										<Badge size="xs" color="red" variant="light">
											{getPriorityText(task.priority)}
										</Badge>
									)}
									{task.due && (
										<Badge size="xs" color="blue" variant="light">
											{formatDueDate(task.due)}
										</Badge>
									)}
									{task.labels.map((label) => (
										<Badge key={label} size="xs" variant="dot">
											{label}
										</Badge>
									))}
								</Group>
							</Box>

							<ActionIcon
								variant="subtle"
								color="gray"
								size="sm"
								onClick={() => openInTodoist(task.id)}
								title="Todoistで開く"
							>
								<IconExternalLink size={16} />
							</ActionIcon>
						</Group>
					</Stack>
				</Box>

				{/* Complete checkbox */}
				<Checkbox
					checked={false}
					onChange={() => onComplete(task.id)}
					title="タスクを完了にする"
					size="md"
					style={{ marginTop: 4 }}
				/>
			</Group>
		</Box>
	);
}
