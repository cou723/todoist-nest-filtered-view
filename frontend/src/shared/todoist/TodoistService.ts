/**
 * TodoistService - Todoist タスク操作のメインサービス
 *
 * このサービスは、タスクの取得、完了、管理のための型安全な操作を提供します。
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
	TasksApiResponse,
	type TasksResponse,
} from "./schema";

export interface ITodoistService {
	/**
	 * フィルタクエリでタスクを取得
	 * @param query オプションの Todoist フィルタクエリ（すべてのタスクには空文字列）
	 * @returns フィルタに一致するタスクの配列
	 */
	readonly fetchTasksByFilter: (
		query?: string,
	) => Effect.Effect<Task[], TodoistErrorType>;

	/**
	 * ID でタスクを 1 つ取得
	 * @param id タスク ID
	 * @returns タスクまたは NotFoundError
	 */
	readonly fetchTask: (id: string) => Effect.Effect<Task, TodoistErrorType>;

	/**
	 * 完全な親階層を持つタスクを取得
	 * @param id タスク ID
	 * @returns 再帰的な親情報を持つ TaskNode
	 */
	readonly fetchTaskNode: (
		id: string,
	) => Effect.Effect<TaskNode, TodoistErrorType>;

	/**
	 * 親階層を持つツリーとして複数のタスクを取得
	 * @param query オプションのフィルタクエリ
	 * @returns 親情報を持つ TaskNode の配列
	 */
	readonly fetchTasksTree: (
		query?: string,
	) => Effect.Effect<TaskNode[], TodoistErrorType>;

	readonly completeTask: (id: string) => Effect.Effect<void, TodoistErrorType>;

	/**
	 * タスクまたはその祖先が依存関係ラベルを持つかチェック
	 * @param taskNode チェックする TaskNode
	 * @returns タスクまたは祖先が dep-* ラベルを持つ場合 true
	 */
	readonly hasDepLabelInAncestors: (taskNode: TaskNode) => boolean;
}

export class TodoistService extends Context.Tag("TodoistService")<
	TodoistService,
	ITodoistService
>() {}

// ヘルパー関数: API レスポンスをデコード
const decodeTasksResponse = (
	response: unknown,
): Effect.Effect<TasksResponse, ParseError> =>
	Effect.gen(function* () {
		const apiResponse = yield* S.decodeUnknown(TasksApiResponse)(response).pipe(
			Effect.mapError(
				(error) =>
					new ParseError({
						message: "タスクレスポンスの解析に失敗しました",
						cause: error,
					}),
			),
		);

		return Array.isArray(apiResponse)
			? { results: apiResponse as Task[], nextCursor: undefined }
			: (apiResponse as TasksResponse);
	});

// ヘルパー関数: タスクをキャッシュに追加
const cacheTasks = (tasks: readonly Task[], cache: Map<string, Task>): void => {
	for (const task of tasks) {
		cache.set(task.id, task);
	}
};

// ヘルパー関数: クエリパラメータを構築
const buildTasksUrl = (query?: string, cursor?: string | null): string => {
	const params = new URLSearchParams();
	if (query) params.set("filter", query);
	if (cursor) params.set("cursor", cursor);
	const queryString = params.toString();
	return `/tasks${queryString ? `?${queryString}` : ""}`;
};

export const TodoistServiceLive = Layer.effect(
	TodoistService,
	Effect.gen(function* () {
		const httpClient = yield* TodoistHttpClient;

		const taskCache = new Map<string, Task>();
		const pendingFetches = new Map<string, Promise<Task>>();

		const fetchTasksByFilter = (
			query?: string,
		): Effect.Effect<Task[], TodoistErrorType> =>
			Effect.gen(function* () {
				const allTasks: Task[] = [];
				let cursor: string | null = null;

				do {
					const url = buildTasksUrl(query, cursor);
					const response = yield* httpClient.get(url);
					const tasksResponse = yield* decodeTasksResponse(response);

					allTasks.push(...tasksResponse.results);
					cacheTasks(tasksResponse.results, taskCache);

					cursor = tasksResponse.nextCursor ?? null;
				} while (cursor !== null);

				return allTasks;
			});

		const fetchTask = (id: string): Effect.Effect<Task, TodoistErrorType> =>
			Effect.gen(function* () {
				const cached = taskCache.get(id);
				if (cached) {
					return cached;
				}

				const pending = pendingFetches.get(id);
				if (pending) {
					return yield* Effect.promise(() => pending);
				}

				const response = yield* httpClient.get(`/tasks/${id}`);

				const task = yield* S.decodeUnknown(Task)(response).pipe(
					Effect.mapError(
						(error) =>
							new ParseError({
								message: "タスクのデコードに失敗しました",
								cause: error,
							}),
					),
				);

				taskCache.set(id, task);

				return task;
			});

		const fetchTaskNode = (
			id: string,
		): Effect.Effect<TaskNode, TodoistErrorType> =>
			Effect.gen(function* () {
				const task = yield* fetchTask(id);

				if (!task.parentId) {
					return { ...task, parent: undefined };
				}

				const parent = yield* fetchTaskNode(task.parentId);

				return {
					...task,
					parent,
				};
			});

		const fetchTasksTree = (
			query?: string,
		): Effect.Effect<TaskNode[], TodoistErrorType> =>
			Effect.gen(function* () {
				const tasks = yield* fetchTasksByFilter(query);

				const taskNodesEffects = tasks.map((task) => fetchTaskNode(task.id));

				return yield* Effect.all(taskNodesEffects, { concurrency: 10 });
			});

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

				taskCache.delete(id);
			});

		const hasDepLabelInAncestors = (taskNode: TaskNode): boolean => {
			if (hasDependencyLabel(taskNode.labels)) {
				return true;
			}

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
