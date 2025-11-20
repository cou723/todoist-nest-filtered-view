/**
 * AuthService - OAuth 認証のサービス
 *
 * このサービスは、OAuth トークンの交換、保存、検証を処理します。
 */

import { Schema as S } from "@effect/schema";
import { Context, Effect, Layer, Option } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { AuthError, ParseError } from "../errors/types";
import { TodoistHttpClient } from "../http/client";
import { OAuthTokenResponse } from "./schema";

/**
 * OAuth 設定
 */
export interface OAuthConfig {
	readonly clientId: string;
	readonly redirectUri: string;
	readonly scope?: string;
}

/**
 * AuthService インターフェース
 */
export interface IAuthService {
	/**
	 * OAuth 認可 URL を生成
	 * @returns 認可 URL と CSRF 保護のための state
	 */
	readonly generateAuthUrl: () => Effect.Effect<
		{ url: string; state: string },
		never
	>;

	/**
	 * 認可コードをアクセストークンと交換
	 * @param code OAuth コールバックからの認可コード
	 * @param state CSRF 検証のための state パラメータ
	 * @returns アクセストークン
	 */
	readonly exchangeCode: (
		code: string,
		state: string,
	) => Effect.Effect<string, TodoistErrorType>;

	/**
	 * localStorage にトークンを保存
	 * @param token アクセストークン
	 */
	readonly saveToken: (token: string) => Effect.Effect<void, never>;

	/**
	 * localStorage からトークンを取得
	 * @returns トークンまたは見つからない場合は Option.none
	 */
	readonly getToken: () => Effect.Effect<Option.Option<string>, never>;

	/**
	 * localStorage からトークンを削除
	 */
	readonly removeToken: () => Effect.Effect<void, never>;

	/**
	 * ユーザーが認証されているかチェック
	 * @returns localStorage にトークンが存在する場合 true
	 */
	readonly isAuthenticated: () => Effect.Effect<boolean, never>;

	/**
	 * 保存された state がコールバックの state と一致するか検証（CSRF 保護）
	 * @param callbackState OAuth コールバックからの state
	 * @returns state が有効な場合 true
	 */
	readonly validateState: (
		callbackState: string,
	) => Effect.Effect<boolean, never>;
}

export class AuthService extends Context.Tag("AuthService")<
	AuthService,
	IAuthService
>() {}

const TOKEN_KEY = "todoist_token";
const STATE_KEY = "oauth_state";

// ヘルパー関数: OAuth URL を生成
const buildOAuthUrl = (
	clientId: string,
	scope: string,
	state: string,
): string => {
	const params = new URLSearchParams({
		client_id: clientId,
		scope,
		state,
	});
	return `https://todoist.com/oauth/authorize?${params.toString()}`;
};

// ヘルパー関数: state を保存
const saveState = (state: string): void => {
	localStorage.setItem(STATE_KEY, state);
	sessionStorage.setItem(STATE_KEY, state);
};

// ヘルパー関数: state を削除
const clearState = (): void => {
	localStorage.removeItem(STATE_KEY);
	sessionStorage.removeItem(STATE_KEY);
};

// ヘルパー関数: トークンレスポンスをデコード
const decodeTokenResponse = (
	response: unknown,
): Effect.Effect<OAuthTokenResponse, ParseError> =>
	S.decodeUnknown(OAuthTokenResponse)(response).pipe(
		Effect.mapError(
			(error) =>
				new ParseError({
					message: "トークンレスポンスの解析に失敗しました",
					cause: error,
				}),
		),
	);

export const AuthServiceLive = (config: OAuthConfig) =>
	Layer.effect(
		AuthService,
		Effect.gen(function* () {
			const httpClient = yield* TodoistHttpClient;

			const generateAuthUrl = (): Effect.Effect<
				{ url: string; state: string },
				never
			> =>
				Effect.sync(() => {
					const state = crypto.randomUUID();
					saveState(state);
					const url = buildOAuthUrl(
						config.clientId,
						config.scope || "data:read_write,data:delete",
						state,
					);
					return { url, state };
				});

			const exchangeCode = (
				code: string,
				state: string,
			): Effect.Effect<string, TodoistErrorType> =>
				Effect.gen(function* () {
					const isValidState = yield* validateState(state);
					if (!isValidState) {
						return yield* Effect.fail(
							new AuthError({
								message: "State validation failed (CSRF protection)",
							}),
						);
					}

					const response = yield* httpClient.post("/oauth/token", {
						client_id: config.clientId,
						code,
						redirect_uri: config.redirectUri,
					});

					const tokenResponse = yield* decodeTokenResponse(response);

					yield* saveToken(tokenResponse.accessToken);
					clearState();

					return tokenResponse.accessToken;
				});

			const saveToken = (token: string): Effect.Effect<void, never> =>
				Effect.sync(() => {
					localStorage.setItem(TOKEN_KEY, token);
				});

			const getToken = (): Effect.Effect<Option.Option<string>, never> =>
				Effect.sync(() => {
					const token = localStorage.getItem(TOKEN_KEY);
					return token !== null ? Option.some(token) : Option.none();
				});

			const removeToken = (): Effect.Effect<void, never> =>
				Effect.sync(() => {
					localStorage.removeItem(TOKEN_KEY);
					localStorage.removeItem(STATE_KEY);
					sessionStorage.removeItem(STATE_KEY);
				});

			const isAuthenticated = (): Effect.Effect<boolean, never> =>
				Effect.gen(function* () {
					const token = yield* getToken();
					return Option.isSome(token);
				});

			const validateState = (
				callbackState: string,
			): Effect.Effect<boolean, never> =>
				Effect.sync(() => {
					const localState = localStorage.getItem(STATE_KEY);
					const sessionState = sessionStorage.getItem(STATE_KEY);

					return (
						(localState === callbackState || sessionState === callbackState) &&
						callbackState.length > 0
					);
				});

			return AuthService.of({
				generateAuthUrl,
				exchangeCode,
				saveToken,
				getToken,
				removeToken,
				isAuthenticated,
				validateState,
			});
		}),
	);
