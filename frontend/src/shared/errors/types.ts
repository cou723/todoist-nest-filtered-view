/**
 * Todoist 操作の共通エラー型
 *
 * Effect の Data モジュールを使用した構造化エラーハンドリングのためのエラー型を定義します。
 */

import { Data } from "effect";

/**
 * すべての Todoist 関連エラーの基底エラー
 */
export class TodoistError extends Data.TaggedError("TodoistError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * ネットワーク関連のエラー（接続失敗、タイムアウトなど）
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * 認証エラー（無効なトークン、期限切れトークンなど）
 */
export class AuthError extends Data.TaggedError("AuthError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * 認可エラー（権限不足）
 */
export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
	readonly message: string;
	readonly resourceId?: string;
	readonly resourceType?: string;
	readonly cause?: unknown;
}> {}

/**
 * 不正なリクエストエラー（無効なパラメータ、不正なデータなど）
 */
export class BadRequestError extends Data.TaggedError("BadRequestError")<{
	readonly message: string;
	readonly details?: unknown;
	readonly cause?: unknown;
}> {}

/**
 * レート制限超過エラー
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
	readonly message: string;
	readonly retryAfter?: number;
	readonly cause?: unknown;
}> {}

/**
 * スキーマ検証エラー
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
	readonly message: string;
	readonly errors?: unknown;
	readonly cause?: unknown;
}> {}

/**
 * サーバーエラー（5xx レスポンス）
 */
export class ServerError extends Data.TaggedError("ServerError")<{
	readonly message: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {}

/**
 * パースエラー（JSON パース、スキーマデコードなど）
 */
export class ParseError extends Data.TaggedError("ParseError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * すべての Todoist エラーの Union 型
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
 * HTTP ステータスコードを適切なエラー型にマッピングするヘルパー関数
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
 * ユーザーフレンドリーなエラーメッセージを作成するヘルパー関数
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
