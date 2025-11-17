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
	AuthError,
	BadRequestError,
	ForbiddenError,
	NetworkError,
	NotFoundError,
	RateLimitError,
	ServerError,
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
 * HttpClientError を TodoistErrorType にマッピング
 */
const mapHttpClientError = (
	error: HttpClientError.HttpClientError | HttpBodyError,
): TodoistErrorType => {
	// HttpBodyError の場合
	if ("_tag" in error && error._tag === "HttpBodyError") {
		return new BadRequestError({
			message: "リクエストボディのエンコードに失敗しました",
			cause: error,
		});
	}

	// ResponseError の場合、ステータスコードを確認
	if (error._tag === "ResponseError") {
		const status = error.response.status;
		const message = error.reason;

		switch (status) {
			case 400:
				return new BadRequestError({ message, cause: error });
			case 401:
				return new AuthError({
					message: "認証エラー: トークンが無効または期限切れです",
					statusCode: status,
					cause: error,
				});
			case 403:
				return new ForbiddenError({
					message: "権限エラー: この操作を実行する権限がありません",
					statusCode: status,
					cause: error,
				});
			case 404:
				return new NotFoundError({
					message: "リソースが見つかりません",
					cause: error,
				});
			case 429:
				return new RateLimitError({
					message: "レート制限エラー: しばらく待ってから再試行してください",
					cause: error,
				});
			case 500:
			case 502:
			case 503:
			case 504:
				return new ServerError({
					message: "サーバーエラー: しばらく待ってから再試行してください",
					statusCode: status,
					cause: error,
				});
			default:
				if (status >= 400 && status < 500) {
					return new BadRequestError({ message, cause: error });
				}
				if (status >= 500) {
					return new ServerError({ message, statusCode: status, cause: error });
				}
				return new NetworkError({ message, statusCode: status, cause: error });
		}
	}

	// RequestError の場合
	if (error._tag === "RequestError") {
		return new NetworkError({
			message: "リクエストエラーが発生しました",
			cause: error,
		});
	}

	// その他のエラー
	return new NetworkError({
		message: "予期しないエラーが発生しました",
		cause: error,
	});
};

/**
 * オプション設定を使用して HTTP クライアントレイヤーを作成
 */
export const TodoistHttpClientLive = (
	config?: HttpClientConfig,
): Layer.Layer<TodoistHttpClient, never, HttpClient.HttpClient> =>
	Layer.effect(
		TodoistHttpClient,
		Effect.gen(function* () {
			const httpClient = yield* HttpClient.HttpClient;

			// ヘッダーを設定するヘルパー
			const buildHeaders = (options?: {
				headers?: Record<string, string>;
			}): Record<string, string> => ({
				"Content-Type": "application/json",
				...(config?.token ? { Authorization: `Bearer ${config.token}` } : {}),
				...config?.defaultHeaders,
				...options?.headers,
			});

			// フル URL を構築するヘルパー
			const buildUrl = (url: string): string =>
				config?.baseUrl ? `${config.baseUrl}${url}` : url;

			return TodoistHttpClient.of({
				get: (url: string, options?: { headers?: Record<string, string> }) =>
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
					options?: { headers?: Record<string, string> },
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

				delete: (url: string, options?: { headers?: Record<string, string> }) =>
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
export const createProxyClient = (proxyUrl?: string) =>
	Layer.provide(
		TodoistHttpClientLive({
			baseUrl:
				proxyUrl || import.meta.env.VITE_PROXY_URL || "http://localhost:8000",
		}),
		FetchHttpClient.layer,
	);
