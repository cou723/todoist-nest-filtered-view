/**
 * モック用 TodoistHttpClient Layer
 *
 * HTTP リクエストを発生させず、固定レスポンス（fixture）を返すモック実装。
 * UI 開発、Storybook 的な動作確認、Vitest によるサービスレイヤテストでの利用を想定。
 */

import { Effect, Layer } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { TodoistHttpClient } from "./client";
import {
	FIXTURE_COMPLETED_TASKS,
	FIXTURE_OAUTH_TOKEN,
	FIXTURE_TASKS,
} from "./fixtures";

/**
 * モック HTTP クライアント Layer
 *
 * URL パターンに基づいて適切な fixture データを返します。
 */
export const TodoistHttpClientMock = (): Layer.Layer<
	TodoistHttpClient,
	never,
	never
> =>
	Layer.succeed(
		TodoistHttpClient,
		TodoistHttpClient.of({
			get: (
				url: string,
				_options?: { readonly headers?: Record<string, string> },
			): Effect.Effect<unknown, TodoistErrorType> =>
				Effect.sync(() => {
					// タスク一覧取得
					if (url.match(/^\/tasks(\?|$)/)) {
						const urlObj = new URL(url, "http://mock");
						const filter = urlObj.searchParams.get("filter");

						if (filter === "@goal") {
							return FIXTURE_TASKS.filter((task) =>
								task.labels.includes("goal"),
							);
						}
						return FIXTURE_TASKS;
					}

					// 単一タスク取得
					if (url.match(/^\/tasks\/[^/]+$/)) {
						const taskId = url.split("/").pop();
						const task = FIXTURE_TASKS.find((t) => t.id === taskId);
						if (task) {
							return task;
						}
						// タスクが見つからない場合も最初のタスクを返す（成功ケースのみ）
						return FIXTURE_TASKS[0];
					}

					// 完了済みタスク取得
					if (url.includes("/v1/tasks/completed/by_completion_date")) {
						return FIXTURE_COMPLETED_TASKS;
					}

					// デフォルト: 空配列
					return [];
				}),

			post: (
				url: string,
				_body?: unknown,
				_options?: { readonly headers?: Record<string, string> },
			): Effect.Effect<unknown, TodoistErrorType> =>
				Effect.sync(() => {
					// タスク完了
					if (url.match(/^\/tasks\/[^/]+\/close$/)) {
						// 204 No Content を模倣（成功）
						return null;
					}

					// OAuth トークン交換
					if (url.includes("/oauth/token")) {
						return FIXTURE_OAUTH_TOKEN;
					}

					// デフォルト: 空オブジェクト
					return {};
				}),

			delete: (
				_url: string,
				_options?: { readonly headers?: Record<string, string> },
			): Effect.Effect<void, TodoistErrorType> =>
				Effect.sync(() => {
					// 成功を返す
				}),
		}),
	);
