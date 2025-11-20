/**
 * MockTaskListPanel - Development version with mock data for screenshots
 */

import {
	ActionIcon,
	Box,
	Group,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { PanelWrapper } from "../shared/components/PanelWrapper";
import type { TaskNode } from "../shared/todoist/schema";
import { SettingsModal } from "../features/task-list/components/SettingsModal";
import { TaskItem } from "../features/task-list/components/TaskItem";
import { useDebounce } from "../features/task-list/hooks/useDebounce";
import { useTaskListSettings } from "../features/task-list/hooks/useTaskListSettings";
import { sortTasksByPriority } from "../features/task-list/utils/taskUtils";
import { MOCK_TASKS } from "./mockTaskData";

// Build task tree from flat list
function buildTaskTree(tasks: typeof MOCK_TASKS): TaskNode[] {
	const taskMap = new Map<string, TaskNode>();

	// First pass: create all task nodes
	for (const task of tasks) {
		taskMap.set(task.id, { ...task, parent: undefined });
	}

	// Second pass: build parent relationships
	const result: TaskNode[] = [];
	for (const task of tasks) {
		const node = taskMap.get(task.id)!;
		if (task.parentId) {
			const parent = taskMap.get(task.parentId);
			if (parent) {
				node.parent = parent;
			}
		}
		result.push(node);
	}

	return result;
}

function hasDepLabel(labels: readonly string[]): boolean {
	return labels.some((label) => label.startsWith("dep-"));
}

function hasDepLabelInAncestors(task: TaskNode): boolean {
	if (hasDepLabel(task.labels)) {
		return true;
	}
	if (task.parent) {
		return hasDepLabelInAncestors(task.parent);
	}
	return false;
}

export function MockTaskListPanel() {
	const [settingsOpen, setSettingsOpen] = useState(false);

	const { filterQuery, setFilterQuery, hideDepTasks, setHideDepTasks } =
		useTaskListSettings();

	// Debounce filter query to avoid too many updates
	const debouncedFilterQuery = useDebounce(filterQuery, 500);

	// Build task tree and apply filters
	const tasks = useMemo(() => {
		const tree = buildTaskTree(MOCK_TASKS);

		// Apply filter query (simple content match)
		let filtered = tree;
		if (debouncedFilterQuery) {
			filtered = tree.filter((task) =>
				task.content.toLowerCase().includes(debouncedFilterQuery.toLowerCase()),
			);
		}

		// Apply dep-label filter
		if (hideDepTasks) {
			filtered = filtered.filter((task) => !hasDepLabelInAncestors(task));
		}

		return filtered;
	}, [debouncedFilterQuery, hideDepTasks]);

	const handleCompleteTask = (taskId: string) => {
		toast.success("タスクを完了しました");
		console.log("Complete task:", taskId);
	};

	const sortedTasks = useMemo(() => {
		return sortTasksByPriority(tasks);
	}, [tasks]);

	return (
		<>
			<Toaster position="top-right" />
			<PanelWrapper data-testid="task-list-panel">
				<Stack gap="md">
					<Group justify="space-between" align="center">
						<Title order={3}>タスク一覧</Title>
						<ActionIcon
							variant="subtle"
							onClick={() => setSettingsOpen(true)}
							title="設定"
						>
							<IconSettings size={20} />
						</ActionIcon>
					</Group>

					{sortedTasks.length === 0 && (
						<Text c="dimmed" size="sm" ta="center" py="xl">
							タスクがありません
						</Text>
					)}

					{sortedTasks.length > 0 && (
						<ScrollArea h={400}>
							<Stack gap={0}>
								{sortedTasks.map((task) => (
									<TaskItem
										key={task.id}
										task={task}
										onComplete={handleCompleteTask}
									/>
								))}
							</Stack>
						</ScrollArea>
					)}
				</Stack>
			</PanelWrapper>

			<SettingsModal
				opened={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				filterQuery={filterQuery}
				hideDepTasks={hideDepTasks}
				onFilterQueryChange={setFilterQuery}
				onHideDepTasksChange={setHideDepTasks}
			/>
		</>
	);
}
