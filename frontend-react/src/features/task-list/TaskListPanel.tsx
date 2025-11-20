/**
 * TaskListPanel - フィルタ付きツリー表示タスク一覧パネル
 */

import {
	ActionIcon,
	Box,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Effect, Layer } from "effect";
import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../app/AuthContext";
import { PanelWrapper } from "../../shared/components/PanelWrapper";
import type { TodoistErrorType } from "../../shared/errors/types";
import { TodoistHttpClient } from "../../shared/http/client";
import {
	TodoistService,
	TodoistServiceLive,
} from "../../shared/todoist/TodoistService";
import { SettingsModal } from "./components/SettingsModal";
import { TaskItem } from "./components/TaskItem";
import { useDebounce } from "./hooks/useDebounce";
import { useTaskListSettings } from "./hooks/useTaskListSettings";
import { sortTasksByPriority } from "./utils/taskUtils";

export function TaskListPanel() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	const [settingsOpen, setSettingsOpen] = useState(false);

	const { filterQuery, setFilterQuery, hideDepTasks, setHideDepTasks } =
		useTaskListSettings();

	// Debounce filter query to avoid too many API calls
	const debouncedFilterQuery = useDebounce(filterQuery, 500);

	// Create layer with TodoistService
	const serviceLayer = useMemo(() => {
		if (!token) return null;

		const httpLayer = Layer.succeed(
			TodoistHttpClient,
			TodoistHttpClient.of({
				get: (url: string) =>
					Effect.tryPromise({
						try: async () => {
							const response = await fetch(
								`https://api.todoist.com/rest/v2${url}`,
								{
									headers: {
										Authorization: `Bearer ${token}`,
									},
								},
							);
							if (!response.ok) {
								throw new Error(`HTTP error! status: ${response.status}`);
							}
							return response.json();
						},
						catch: (error) => error as Error,
					}) as Effect.Effect<unknown, TodoistErrorType>,
				post: (url: string) =>
					Effect.tryPromise({
						try: async () => {
							const response = await fetch(
								`https://api.todoist.com/rest/v2${url}`,
								{
									method: "POST",
									headers: {
										Authorization: `Bearer ${token}`,
									},
								},
							);
							if (!response.ok) {
								throw new Error(`HTTP error! status: ${response.status}`);
							}
							return response.json();
						},
						catch: (error) => error as Error,
					}) as Effect.Effect<unknown, TodoistErrorType>,
				delete: (url: string) =>
					Effect.tryPromise({
						try: async () => {
							const response = await fetch(
								`https://api.todoist.com/rest/v2${url}`,
								{
									method: "DELETE",
									headers: {
										Authorization: `Bearer ${token}`,
									},
								},
							);
							if (!response.ok) {
								throw new Error(`HTTP error! status: ${response.status}`);
							}
						},
						catch: (error) => error as Error,
					}) as Effect.Effect<void, TodoistErrorType>,
			}),
		);

		return TodoistServiceLive.pipe(Layer.provide(httpLayer));
	}, [token]);

	// Fetch tasks with react-query
	const {
		data: tasks,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["tasks", debouncedFilterQuery, hideDepTasks],
		queryFn: async () => {
			if (!serviceLayer) throw new Error("Service layer not initialized");

			const program = Effect.gen(function* () {
				const service = yield* TodoistService;
				const allTasks = yield* service.fetchTasksTree(
					debouncedFilterQuery || undefined,
				);

				// Filter tasks with dep- labels if needed
				if (hideDepTasks) {
					return allTasks.filter(
						(task) => !service.hasDepLabelInAncestors(task),
					);
				}

				return allTasks;
			}).pipe(Effect.provide(serviceLayer));

			return Effect.runPromise(program);
		},
		enabled: !!token && !!serviceLayer,
	});

	// Complete task mutation
	const completeMutation = useMutation({
		mutationFn: async (taskId: string) => {
			if (!serviceLayer) throw new Error("Service layer not initialized");

			const program = Effect.gen(function* () {
				const service = yield* TodoistService;
				yield* service.completeTask(taskId);
			}).pipe(Effect.provide(serviceLayer));

			return Effect.runPromise(program);
		},
		onSuccess: () => {
			// Invalidate and refetch
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
			toast.success("タスクを完了しました");
		},
		onError: (error) => {
			toast.error(`タスクの完了に失敗しました: ${error.message}`);
		},
	});

	const handleCompleteTask = (taskId: string) => {
		completeMutation.mutate(taskId);
	};

	const sortedTasks = useMemo(() => {
		if (!tasks) return [];
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

					{isLoading && (
						<Box ta="center" py="xl">
							<Loader size="sm" />
							<Text size="sm" c="dimmed" mt="md">
								読み込み中...
							</Text>
						</Box>
					)}

					{error && (
						<Text c="red" size="sm" ta="center">
							エラー: {error instanceof Error ? error.message : "不明なエラー"}
						</Text>
					)}

					{!isLoading && !error && sortedTasks.length === 0 && (
						<Text c="dimmed" size="sm" ta="center" py="xl">
							タスクがありません
						</Text>
					)}

					{!isLoading && !error && sortedTasks.length > 0 && (
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
