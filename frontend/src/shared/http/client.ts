/**
 * HTTP Client with Effect Integration
 *
 * This module provides a simple HTTP client using native fetch wrapped in Effect.
 */

import { Context, Effect, Layer } from "effect";
import {
	mapHttpError,
	NetworkError,
	ParseError,
	type TodoistErrorType,
} from "../errors/types";

/**
 * HTTP Client Service Tag
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
 * Configuration for the HTTP client
 */
export interface HttpClientConfig {
	readonly baseUrl?: string;
	readonly defaultHeaders?: Record<string, string>;
	readonly token?: string;
}

/**
 * Create HTTP client layer with optional configuration
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
 * Handle errors from fetch operations
 */
const handleError = (error: unknown): TodoistErrorType => {
	// If already a TodoistErrorType, return as-is
	if (
		error &&
		typeof error === "object" &&
		"_tag" in error &&
		typeof error._tag === "string"
	) {
		return error as TodoistErrorType;
	}

	// Handle fetch/network errors
	if (error instanceof Error) {
		if (error.name === "TypeError" || error.message.includes("fetch")) {
			return new NetworkError({
				message: "ネットワークエラーが発生しました",
				cause: error,
			});
		}
	}

	// Handle JSON parse errors
	if (error instanceof SyntaxError) {
		return new ParseError({
			message: "レスポンスの解析に失敗しました",
			cause: error,
		});
	}

	// Default to network error
	return new NetworkError({
		message: "予期しないエラーが発生しました",
		cause: error,
	});
};

/**
 * Helper to create a configured HTTP client for Todoist API
 */
export const createTodoistClient = (token: string) =>
	TodoistHttpClientLive({
		baseUrl: "https://api.todoist.com/rest/v2",
		token,
	});

/**
 * Helper to create a configured HTTP client for the proxy
 */
export const createProxyClient = (proxyUrl?: string) =>
	TodoistHttpClientLive({
		baseUrl:
			proxyUrl || import.meta.env.VITE_PROXY_URL || "http://localhost:8000",
	});
