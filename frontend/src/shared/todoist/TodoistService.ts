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
	TasksResponse,
} from "./schema";

/**
 * TodoistService インターフェース
 */
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

	/**
	 * タスクを完了する
	 * @param id タスク ID
	 * @returns 成功または失敗するエフェクト
	 */
	readonly completeTask: (id: string) => Effect.Effect<void, TodoistErrorType>;

	/**
	 * タスクまたはその祖先が依存関係ラベルを持つかチェック
	 * @param taskNode チェックする TaskNode
	 * @returns タスクまたは祖先が dep-* ラベルを持つ場合 true
	 */
	readonly hasDepLabelInAncestors: (taskNode: TaskNode) => boolean;
}

/**
 * TodoistService タグ
 */
export class TodoistService extends Context.Tag("TodoistService")<
	TodoistService,
	ITodoistService
>() {}

/**
 * TodoistService レイヤーを作成
 */
export const TodoistServiceLive = Layer.effect(
	TodoistService,
	Effect.gen(function* () {
		const httpClient = yield* TodoistHttpClient;

		// タスクのインメモリキャッシュ
		const taskCache = new Map<string, Task>();
		const pendingFetches = new Map<string, Promise<Task>>();

		/**
		 * ページネーション付きでフィルタに一致するすべてのタスクを取得
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

					// タスクをデコードs using schema
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

					// キャッシュを更新
					for (const task of tasksResponse.results) {
						taskCache.set(task.id, task);
					}

					cursor = tasksResponse.nextCursor ?? null;
				} while (cursor !== null);

				return allTasks;
			});

		/**
		 * ID でタスクを 1 つ取得
		 */
		const fetchTask = (id: string): Effect.Effect<Task, TodoistErrorType> =>
			Effect.gen(function* () {
				// まずキャッシュを確認
				const cached = taskCache.get(id);
				if (cached) {
					return cached;
				}

				// すでに取得中か確認
				const pending = pendingFetches.get(id);
				if (pending) {
					return yield* Effect.promise(() => pending);
				}

				// API からタスクを取得
				const response = yield* httpClient.get(`/tasks/${id}`);

				// タスクをデコード
				const task = yield* S.decodeUnknown(Task)(response).pipe(
					Effect.mapError(
						(error) =>
							new ParseError({
								message: "タスクのデコードに失敗しました",
								cause: error,
							}),
					),
				);

				// キャッシュを更新
				taskCache.set(id, task);

				return task;
			});

		/**
		 * 親階層を持つタスクを取得
		 */
		const fetchTaskNode = (
			id: string,
		): Effect.Effect<TaskNode, TodoistErrorType> =>
			Effect.gen(function* () {
				const task = yield* fetchTask(id);

				// 親がない場合、TaskNode としてタスクを返す
				if (!task.parentId) {
					return { ...task, parent: undefined };
				}

				// 再帰的に親を取得
				const parent = yield* fetchTaskNode(task.parentId);

				return {
					...task,
					parent,
				};
			});

		/**
		 * 親階層を持つタスクツリーを取得
		 */
		const fetchTasksTree = (
			query?: string,
		): Effect.Effect<TaskNode[], TodoistErrorType> =>
			Effect.gen(function* () {
				const tasks = yield* fetchTasksByFilter(query);

				// 各タスクの親階層を持つ TaskNode を取得
				const taskNodesEffects = tasks.map((task) => fetchTaskNode(task.id));

				return yield* Effect.all(taskNodesEffects, { concurrency: 10 });
			});

		/**
		 * タスクを完了する
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

				// キャッシュから削除
				taskCache.delete(id);
			});

		/**
		 * Check if task or ancestors have dependency label
		 */
		const hasDepLabelInAncestors = (taskNode: TaskNode): boolean => {
			// 現在のタスクをチェック
			// 互換性のために readonly 配列を通常の配列に変換
			const labels = [...taskNode.labels];
			if (hasDependencyLabel(labels)) {
				return true;
			}

			// 親を再帰的にチェック
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
