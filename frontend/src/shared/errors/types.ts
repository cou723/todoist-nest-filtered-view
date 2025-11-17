/**
 * Common Error Types for Todoist Operations
 *
 * This file defines error types using Effect's Data module for structured error handling.
 */

import { Data } from "effect";

/**
 * Base error for all Todoist-related errors
 */
export class TodoistError extends Data.TaggedError("TodoistError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Network-related errors (connection failures, timeouts, etc.)
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * Authentication errors (invalid token, expired token, etc.)
 */
export class AuthError extends Data.TaggedError("AuthError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * Authorization errors (insufficient permissions)
 */
export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * Resource not found errors
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	readonly message: string;
	readonly resourceId?: string;
	readonly resourceType?: string;
	readonly cause?: unknown;
}> {}

/**
 * Bad request errors (invalid parameters, malformed data, etc.)
 */
export class BadRequestError extends Data.TaggedError("BadRequestError")<{
	readonly message: string;
	readonly details?: unknown;
	readonly cause?: unknown;
}> {}

/**
 * Rate limit exceeded errors
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
	readonly message: string;
	readonly retryAfter?: number;
	readonly cause?: unknown;
}> {}

/**
 * Schema validation errors
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly message: string;
	readonly errors?: unknown;
	readonly cause?: unknown;
}> {}

/**
 * Server errors (5xx responses)
 */
export class ServerError extends Data.TaggedError("ServerError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * Parse errors (JSON parsing, schema decoding, etc.)
 */
export class ParseError extends Data.TaggedError("ParseError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Union type of all possible Todoist errors
 */
export type TodoistErrorType =
	| TodoistError
	| NetworkError
	| AuthError
	| ForbiddenError
	| NotFoundError
	| BadRequestError
	| RateLimitError
	| ValidationError
	| ServerError
	| ParseError;

/**
 * Helper function to map HTTP status codes to appropriate error types
 */
export const mapHttpError = (
	statusCode: number,
	message: string,
	cause?: unknown,
): TodoistErrorType => {
	switch (statusCode) {
		case 400:
			return new BadRequestError({ message, cause });
		case 401:
			return new AuthError({ message, statusCode, cause });
		case 403:
			return new ForbiddenError({ message, statusCode, cause });
		case 404:
			return new NotFoundError({ message, cause });
		case 429:
			return new RateLimitError({ message, cause });
		case 500:
		case 502:
		case 503:
		case 504:
			return new ServerError({ message, statusCode, cause });
		default:
			if (statusCode >= 400 && statusCode < 500) {
				return new BadRequestError({ message, cause });
			}
			if (statusCode >= 500) {
				return new ServerError({ message, statusCode, cause });
			}
			return new TodoistError({ message, cause });
	}
};

/**
 * Helper function to create a user-friendly error message
 */
export const formatErrorMessage = (error: TodoistErrorType): string => {
	switch (error._tag) {
		case "AuthError":
			return "認証エラー: トークンが無効または期限切れです";
		case "ForbiddenError":
			return "権限エラー: この操作を実行する権限がありません";
		case "NotFoundError":
			return `${error.resourceType || "リソース"}が見つかりません`;
		case "BadRequestError":
			return `リクエストエラー: ${error.message}`;
		case "RateLimitError":
			return "レート制限エラー: しばらく待ってから再試行してください";
		case "NetworkError":
			return `ネットワークエラー: ${error.message}`;
		case "ServerError":
			return "サーバーエラー: しばらく待ってから再試行してください";
		case "ValidationError":
			return `バリデーションエラー: ${error.message}`;
		case "ParseError":
			return `データ解析エラー: ${error.message}`;
		default:
			return error.message;
	}
};
