/**
 * TodoistService - Main service for Todoist task operations
 *
 * This service provides type-safe operations for fetching, completing, and managing tasks.
 */

import { Schema as S } from "@effect/schema";
import { Context, Effect, Layer } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { NotFoundError, ParseError } from "../errors/types";
import { TodoistHttpClient } from "../http/client";
import {
	hasDependencyLabel,
	Task,
	type TaskNode,
	TasksResponse,
} from "./schema";

/**
 * TodoistService interface
 */
export interface ITodoistService {
	/**
	 * Fetch tasks by filter query
	 * @param query Optional Todoist filter query (empty string for all tasks)
	 * @returns Array of tasks matching the filter
	 */
	readonly fetchTasksByFilter: (
		query?: string,
	) => Effect.Effect<Task[], TodoistErrorType>;

	/**
	 * Fetch a single task by ID
	 * @param id Task ID
	 * @returns Task or NotFoundError
	 */
	readonly fetchTask: (id: string) => Effect.Effect<Task, TodoistErrorType>;

	/**
	 * Fetch task with full parent hierarchy
	 * @param id Task ID
	 * @returns TaskNode with recursive parent information
	 */
	readonly fetchTaskNode: (
		id: string,
	) => Effect.Effect<TaskNode, TodoistErrorType>;

	/**
	 * Fetch multiple tasks as tree with parent hierarchy
	 * @param query Optional filter query
	 * @returns Array of TaskNodes with parent information
	 */
	readonly fetchTasksTree: (
		query?: string,
	) => Effect.Effect<TaskNode[], TodoistErrorType>;

	/**
	 * Complete a task
	 * @param id Task ID
	 * @returns Effect that completes successfully or fails with error
	 */
	readonly completeTask: (id: string) => Effect.Effect<void, TodoistErrorType>;

	/**
	 * Check if a task or its ancestors have dependency labels
	 * @param taskNode TaskNode to check
	 * @returns true if task or any ancestor has dep-* label
	 */
	readonly hasDepLabelInAncestors: (taskNode: TaskNode) => boolean;
}

/**
 * TodoistService Tag
 */
export class TodoistService extends Context.Tag("TodoistService")<
	TodoistService,
	ITodoistService
>() {}

/**
 * Create TodoistService layer
 */
export const TodoistServiceLive = Layer.effect(
	TodoistService,
	Effect.gen(function* () {
		const httpClient = yield* TodoistHttpClient;

		// In-memory cache for tasks
		const taskCache = new Map<string, Task>();
		const pendingFetches = new Map<string, Promise<Task>>();

		/**
		 * Fetch all tasks matching a filter with pagination
		 */
		const fetchTasksByFilter = (
			query?: string,
		): Effect.Effect<Task[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allTasks: Task[] = [];
				let cursor: string | null = null;

				do {
					const params = new URLSearchParams();
					if (query) params.set("filter", query);
					if (cursor) params.set("cursor", cursor);

					const queryString = params.toString();
					const url = `/tasks${queryString ? `?${queryString}` : ""}`;

					const response = yield* httpClient.get(url);

					// Parse and validate response
					const parsed = yield* Effect.try({
						try: () => {
							// Todoist API returns either direct array or paginated response
							if (Array.isArray(response)) {
								return { results: response, nextCursor: null };
							}
							return response as {
								results: unknown[];
								nextCursor?: string | null;
							};
						},
						catch: (error) =>
							new ParseError({
								message: "タスクレスポンスの解析に失敗しました",
								cause: error,
							}),
					});

					// Decode tasks using schema
					const tasksResponse = yield* S.decodeUnknown(TasksResponse)(
						parsed,
					).pipe(
						Effect.mapError(
							(error) =>
								new ParseError({
									message: "タスクのバリデーションに失敗しました",
									cause: error,
								}),
						),
					);

					allTasks.push(...tasksResponse.results);

					// Update cache
					for (const task of tasksResponse.results) {
						taskCache.set(task.id, task);
					}

					cursor = tasksResponse.nextCursor ?? null;
				} while (cursor !== null);

				return allTasks;
			});

		/**
		 * Fetch a single task by ID
		 */
		const fetchTask = (id: string): Effect.Effect<Task, TodoistErrorType> =>
			Effect.gen(function* () {
				// Check cache first
				const cached = taskCache.get(id);
				if (cached) {
					return cached;
				}

				// Check if already fetching
				const pending = pendingFetches.get(id);
				if (pending) {
					return yield* Effect.promise(() => pending);
				}

				// Fetch task from API
				const response = yield* httpClient.get(`/tasks/${id}`);

				// Decode task
				const task = yield* S.decodeUnknown(Task)(response).pipe(
					Effect.mapError(
						(error) =>
							new ParseError({
								message: "タスクのデコードに失敗しました",
								cause: error,
							}),
					),
				);

				// Update cache
				taskCache.set(id, task);

				return task;
			});

		/**
		 * Fetch task with parent hierarchy
		 */
		const fetchTaskNode = (
			id: string,
		): Effect.Effect<TaskNode, TodoistErrorType> =>
			Effect.gen(function* () {
				const task = yield* fetchTask(id);

				// If no parent, return task as TaskNode
				if (!task.parentId) {
					return { ...task, parent: undefined };
				}

				// Recursively fetch parent
				const parent = yield* fetchTaskNode(task.parentId);

				return {
					...task,
					parent,
				};
			});

		/**
		 * Fetch tasks tree with parent hierarchy
		 */
		const fetchTasksTree = (
			query?: string,
		): Effect.Effect<TaskNode[], TodoistErrorType> =>
			Effect.gen(function* () {
				const tasks = yield* fetchTasksByFilter(query);

				// Fetch TaskNode for each task with parent hierarchy
				const taskNodesEffects = tasks.map((task) => fetchTaskNode(task.id));

				return yield* Effect.all(taskNodesEffects, { concurrency: 10 });
			});

		/**
		 * Complete a task
		 */
		const completeTask = (id: string): Effect.Effect<void, TodoistErrorType> =>
			Effect.gen(function* () {
				if (!id || typeof id !== "string" || id.trim() === "") {
					return yield* Effect.fail(
						new NotFoundError({
							message: "無効なタスクIDです",
							resourceId: id,
							resourceType: "Task",
						}),
					);
				}

				yield* httpClient.post(`/tasks/${id}/close`);

				// Remove from cache
				taskCache.delete(id);
			});

		/**
		 * Check if task or ancestors have dependency label
		 */
		const hasDepLabelInAncestors = (taskNode: TaskNode): boolean => {
			// Check current task
			// Convert readonly array to regular array for compatibility
			const labels = [...taskNode.labels];
			if (hasDependencyLabel(labels)) {
				return true;
			}

			// Check parent recursively
			if (taskNode.parent) {
				return hasDepLabelInAncestors(taskNode.parent);
			}

			return false;
		};

		return TodoistService.of({
			fetchTasksByFilter,
			fetchTask,
			fetchTaskNode,
			fetchTasksTree,
			completeTask,
			hasDepLabelInAncestors,
		});
	}),
);
