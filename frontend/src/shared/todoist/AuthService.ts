/**
 * AuthService - OAuth 認証のサービス
 *
 * このサービスは、OAuth トークンの交換、保存、検証を処理します。
 */

import { Schema as S } from "@effect/schema";
import { Context, Effect, Layer } from "effect";
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
	 * @returns トークンまたは見つからない場合は undefined
	 */
	readonly getToken: () => Effect.Effect<string | undefined, never>;

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

/**
 * AuthService タグ
 */
export class AuthService extends Context.Tag("AuthService")<
	AuthService,
	IAuthService
>() {}

/**
 * ストレージキー
 */
const TOKEN_KEY = "todoist_token";
const STATE_KEY = "oauth_state";

/**
 * AuthService レイヤーを作成
 */
export const AuthServiceLive = (config: OAuthConfig) =>
	Layer.effect(
		AuthService,
		Effect.gen(function* () {
			const httpClient = yield* TodoistHttpClient;

			/**
			 * OAuth 認可 URL を生成
			 */
			const generateAuthUrl = (): Effect.Effect<
				{ url: string; state: string },
				never
			> =>
				Effect.sync(() => {
					// CSRF 保護のためのランダムな state を生成
					const state = crypto.randomUUID();

					// localStorage と sessionStorage に state を保存
					localStorage.setItem(STATE_KEY, state);
					sessionStorage.setItem(STATE_KEY, state);

					// 認可 URL を構築
					const params = new URLSearchParams({
						client_id: config.clientId,
						scope: config.scope || "data:read_write,data:delete",
						state,
					});

					const url = `https://todoist.com/oauth/authorize?${params.toString()}`;

					return { url, state };
				});

			/**
			 * 認可コードをアクセストークンと交換
			 */
			const exchangeCode = (
				code: string,
				state: string,
			): Effect.Effect<string, TodoistErrorType> =>
				Effect.gen(function* () {
					// state を検証
					const isValidState = yield* validateState(state);
					if (!isValidState) {
						return yield* Effect.fail(
							new AuthError({
								message: "State validation failed (CSRF protection)",
							}),
						);
					}

					// プロキシ経由でコードをトークンと交換
					const response = yield* httpClient.post("/oauth/token", {
						client_id: config.clientId,
						code,
						redirect_uri: config.redirectUri,
					});

					// レスポンスを解析して検証
					const tokenResponse = yield* S.decodeUnknown(OAuthTokenResponse)(
						response,
					).pipe(
						Effect.mapError(
							(error) =>
								new ParseError({
									message: "トークンレスポンスの解析に失敗しました",
									cause: error,
								}),
						),
					);

					// トークンを保存
					yield* saveToken(tokenResponse.accessToken);

					// state をクリア
					localStorage.removeItem(STATE_KEY);
					sessionStorage.removeItem(STATE_KEY);

					return tokenResponse.accessToken;
				});

			/**
			 * localStorage にトークンを保存
			 */
			const saveToken = (token: string): Effect.Effect<void, never> =>
				Effect.sync(() => {
					localStorage.setItem(TOKEN_KEY, token);
				});

			/**
			 * localStorage からトークンを取得
			 */
			const getToken = (): Effect.Effect<string | undefined, never> =>
				Effect.sync(() => {
					return localStorage.getItem(TOKEN_KEY) ?? undefined;
				});

			/**
			 * localStorage からトークンを削除
			 */
			const removeToken = (): Effect.Effect<void, never> =>
				Effect.sync(() => {
					localStorage.removeItem(TOKEN_KEY);
					localStorage.removeItem(STATE_KEY);
					sessionStorage.removeItem(STATE_KEY);
				});

			/**
			 * ユーザーが認証されているかチェック
			 */
			const isAuthenticated = (): Effect.Effect<boolean, never> =>
				Effect.gen(function* () {
					const token = yield* getToken();
					return token !== undefined;
				});

			/**
			 * state を検証 parameter
			 */
			const validateState = (
				callbackState: string,
			): Effect.Effect<boolean, never> =>
				Effect.sync(() => {
					// localStorage と sessionStorage の両方をチェック
					const localState = localStorage.getItem(STATE_KEY);
					const sessionState = sessionStorage.getItem(STATE_KEY);

					// state は存在して一致する必要がある
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
