/**
 * Effect 統合 HTTP クライアント
 *
 * @effect/platform の HttpClient を使用した HTTP クライアントを提供します。
 */

import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from "@effect/platform";
import type { HttpBodyError } from "@effect/platform/HttpBody";
import type * as HttpClientError from "@effect/platform/HttpClientError";
import { Context, Effect, Layer, pipe } from "effect";
import {
	BadRequestError,
	mapHttpError,
	NetworkError,
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
			options?: { readonly headers?: Record<string, string> },
		) => Effect.Effect<unknown, TodoistErrorType>;
		readonly post: (
			url: string,
			body?: unknown,
			options?: { readonly headers?: Record<string, string> },
		) => Effect.Effect<unknown, TodoistErrorType>;
		readonly delete: (
			url: string,
			options?: { readonly headers?: Record<string, string> },
		) => Effect.Effect<void, TodoistErrorType>;
	}
>() {}

export interface HttpClientConfig {
	readonly baseUrl?: string;
	readonly defaultHeaders?: Record<string, string>;
	readonly token?: string;
}

const mapHttpClientError = (
	error: HttpClientError.HttpClientError | HttpBodyError,
): TodoistErrorType => {
	if ("_tag" in error && error._tag === "HttpBodyError") {
		return new BadRequestError({
			message: "リクエストボディのエンコードに失敗しました",
			cause: error,
		});
	}

	if (error._tag === "ResponseError") {
		const status = error.response.status;
		const message = error.reason;
		return mapHttpError(status, message, error);
	}

	if (error._tag === "RequestError") {
		return new NetworkError({
			message: "リクエストエラーが発生しました",
			cause: error,
		});
	}

	return new NetworkError({
		message: "予期しないエラーが発生しました",
		cause: error,
	});
};

export const TodoistHttpClientLive = (
	config?: HttpClientConfig,
): Layer.Layer<TodoistHttpClient, never, HttpClient.HttpClient> =>
	Layer.effect(
		TodoistHttpClient,
		Effect.gen(function* () {
			const httpClient = yield* HttpClient.HttpClient;

			const buildHeaders = (options?: {
				readonly headers?: Record<string, string>;
			}): Record<string, string> => ({
				"Content-Type": "application/json",
				...(config?.token ? { Authorization: `Bearer ${config.token}` } : {}),
				...config?.defaultHeaders,
				...options?.headers,
			});

			const buildUrl = (url: string): string => {
				if (url.startsWith("http://") || url.startsWith("https://")) {
					return url;
				}

				return config?.baseUrl ? `${config.baseUrl}${url}` : url;
			};

			return TodoistHttpClient.of({
				get: (
					url: string,
					options?: { readonly headers?: Record<string, string> },
				) =>
					pipe(
						httpClient.get(buildUrl(url), {
							headers: buildHeaders(options),
						}),
						Effect.flatMap(HttpClientResponse.filterStatusOk),
						Effect.flatMap((response) => response.json),
						Effect.mapError(mapHttpClientError),
					),

				post: (
					url: string,
					body?: unknown,
					options?: { readonly headers?: Record<string, string> },
				) =>
					pipe(
						Effect.succeed(HttpClientRequest.post(buildUrl(url))),
						Effect.map(HttpClientRequest.setHeaders(buildHeaders(options))),
						Effect.flatMap((request) =>
							body
								? HttpClientRequest.bodyJson(
										request,
										body as Record<string, unknown>,
									)
								: Effect.succeed(request),
						),
						Effect.flatMap(httpClient.execute),
						Effect.flatMap(HttpClientResponse.filterStatusOk),
						Effect.flatMap((response) => response.json),
						Effect.mapError(mapHttpClientError),
					),

				delete: (
					url: string,
					options?: { readonly headers?: Record<string, string> },
				) =>
					pipe(
						httpClient.del(buildUrl(url), {
							headers: buildHeaders(options),
						}),
						Effect.flatMap(HttpClientResponse.filterStatusOk),
						Effect.asVoid,
						Effect.mapError(mapHttpClientError),
					),
			});
		}),
	);

/**
 * Todoist API 用の設定済み HTTP クライアントを作成するヘルパー
 */
export const createTodoistClient = (token: string) =>
	Layer.provide(
		TodoistHttpClientLive({
			baseUrl: "https://api.todoist.com/rest/v2",
			token,
		}),
		FetchHttpClient.layer,
	);

/**
 * プロキシ用の設定済み HTTP クライアントを作成するヘルパー
 */
export const createProxyClient = (token?: string, proxyUrl?: string) =>
	Layer.provide(
		TodoistHttpClientLive({
			baseUrl:
				proxyUrl || import.meta.env.VITE_PROXY_URL || "http://localhost:8000",
			token,
		}),
		FetchHttpClient.layer,
	);

/**
 * 環境変数に基づいて適切な HTTP クライアントを作成するヘルパー
 *
 * VITE_USE_MOCK_CLIENT=true の場合、モッククライアントを返します。
 * それ以外の場合、実際の Todoist API クライアントを返します。
 *
 * @param token アクセストークン（モック時は無視されます）
 */
export const createClientWithEnv = (token: string) => {
	if (import.meta.env.VITE_USE_MOCK_CLIENT === "true") {
		// 動的インポートを避けるため、ここでは型のみ参照
		// 実際のインポートは使用側で行う
		return import("./mockClient").then((mod) => mod.TodoistHttpClientMock());
	}
	return Promise.resolve(createTodoistClient(token));
};
