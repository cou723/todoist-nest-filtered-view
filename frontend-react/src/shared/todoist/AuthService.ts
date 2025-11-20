/**
 * AuthService - Todoist 認証のサービス
 *
 * このサービスは、Todoist access_token の保存、取得、検証を処理します。
 * access_token はユーザーが直接入力し、localStorage に保存されます。
 */

import { Context, Effect, Layer, Option } from "effect";

/**
 * AuthService インターフェース
 */
export interface IAuthService {
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
}

export class AuthService extends Context.Tag("AuthService")<
	AuthService,
	IAuthService
>() {}

const TOKEN_KEY = "todoist_token";

/**
 * AuthService の実装
 *
 * access_token 直接入力方式を使用します。
 * OAuth コードフローは使用しません。
 */
export const AuthServiceLive = Layer.effect(
	AuthService,
	Effect.gen(function* () {
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
			});

		const isAuthenticated = (): Effect.Effect<boolean, never> =>
			Effect.gen(function* () {
				const token = yield* getToken();
				return Option.isSome(token);
			});

		return AuthService.of({
			saveToken,
			getToken,
			removeToken,
			isAuthenticated,
		});
	}),
);
