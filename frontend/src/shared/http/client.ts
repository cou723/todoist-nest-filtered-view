/**
 * Effect 統合 HTTP クライアント
 *
 * ネイティブ fetch を Effect でラップしたシンプルな HTTP クライアントを提供します。
 */

import { Context, Effect, Layer } from "effect";
import {
	mapHttpError,
	NetworkError,
	ParseError,
	type TodoistErrorType,
} from "../errors/types";

/**
 * HTTP クライアントサービスタグ
 */
export class TodoistHttpClient extends Context.Tag("TodoistHttpClient")<
	TodoistHttpClient,
	{
		readonly get: (
			url: string,
			options?: { headers?: Record<string, string> },
		) => Effect.Effect<unknown, TodoistErrorType>;
		readonly post: (
			url: string,
			body?: unknown,
			options?: { headers?: Record<string, string> },
		) => Effect.Effect<unknown, TodoistErrorType>;
		readonly delete: (
			url: string,
			options?: { headers?: Record<string, string> },
		) => Effect.Effect<void, TodoistErrorType>;
	}
>() {}

/**
 * HTTP クライアントの設定
 */
export interface HttpClientConfig {
	readonly baseUrl?: string;
	readonly defaultHeaders?: Record<string, string>;
	readonly token?: string;
}

/**
 * オプション設定を使用して HTTP クライアントレイヤーを作成
 */
export const TodoistHttpClientLive = (
	config?: HttpClientConfig,
): Layer.Layer<TodoistHttpClient> =>
	Layer.succeed(
		TodoistHttpClient,
		TodoistHttpClient.of({
			get: (url: string, options?: { headers?: Record<string, string> }) =>
				Effect.tryPromise({
					try: async () => {
						const headers = {
							"Content-Type": "application/json",
							...(config?.token
								? { Authorization: `Bearer ${config.token}` }
								: {}),
							...config?.defaultHeaders,
							...options?.headers,
						};

						const fullUrl = config?.baseUrl ? `${config.baseUrl}${url}` : url;

						const response = await fetch(fullUrl, {
							method: "GET",
							headers,
						});

						if (!response.ok) {
							const text = await response.text();
							throw mapHttpError(response.status, text);
						}

						return await response.json();
					},
					catch: (error) => handleError(error),
				}),

			post: (
				url: string,
				body?: unknown,
				options?: { headers?: Record<string, string> },
			) =>
				Effect.tryPromise({
					try: async () => {
						const headers = {
							"Content-Type": "application/json",
							...(config?.token
								? { Authorization: `Bearer ${config.token}` }
								: {}),
							...config?.defaultHeaders,
							...options?.headers,
						};

						const fullUrl = config?.baseUrl ? `${config.baseUrl}${url}` : url;

						const response = await fetch(fullUrl, {
							method: "POST",
							headers,
							body: body ? JSON.stringify(body) : undefined,
						});

						if (!response.ok) {
							const text = await response.text();
							throw mapHttpError(response.status, text);
						}

						return await response.json();
					},
					catch: (error) => handleError(error),
				}),

			delete: (url: string, options?: { headers?: Record<string, string> }) =>
				Effect.tryPromise({
					try: async () => {
						const headers = {
							"Content-Type": "application/json",
							...(config?.token
								? { Authorization: `Bearer ${config.token}` }
								: {}),
							...config?.defaultHeaders,
							...options?.headers,
						};

						const fullUrl = config?.baseUrl ? `${config.baseUrl}${url}` : url;

						const response = await fetch(fullUrl, {
							method: "DELETE",
							headers,
						});

						if (!response.ok) {
							const text = await response.text();
							throw mapHttpError(response.status, text);
						}
					},
					catch: (error) => handleError(error),
				}),
		}),
	);

/**
 * fetch 操作からのエラーを処理
 */
const handleError = (error: unknown): TodoistErrorType => {
	// すでに TodoistErrorType の場合はそのまま返す
	if (
		error &&
		typeof error === "object" &&
		"_tag" in error &&
		typeof error._tag === "string"
	) {
		return error as TodoistErrorType;
	}

	// fetch/ネットワークエラーを処理
	if (error instanceof Error) {
		if (error.name === "TypeError" || error.message.includes("fetch")) {
			return new NetworkError({
				message: "ネットワークエラーが発生しました",
				cause: error,
			});
		}
	}

	// JSON パースエラーを処理
	if (error instanceof SyntaxError) {
		return new ParseError({
			message: "レスポンスの解析に失敗しました",
			cause: error,
		});
	}

	// デフォルトはネットワークエラー
	return new NetworkError({
		message: "予期しないエラーが発生しました",
		cause: error,
	});
};

/**
 * Todoist API 用の設定済み HTTP クライアントを作成するヘルパー
 */
export const createTodoistClient = (token: string) =>
	TodoistHttpClientLive({
		baseUrl: "https://api.todoist.com/rest/v2",
		token,
	});

/**
 * プロキシ用の設定済み HTTP クライアントを作成するヘルパー
 */
export const createProxyClient = (proxyUrl?: string) =>
	TodoistHttpClientLive({
		baseUrl:
			proxyUrl || import.meta.env.VITE_PROXY_URL || "http://localhost:8000",
	});
