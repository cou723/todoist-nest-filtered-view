/**
 * AuthService - Service for OAuth authentication
 *
 * This service handles OAuth token exchange, storage, and validation.
 */

import { Schema as S } from "@effect/schema";
import { Context, Effect, Layer } from "effect";
import type { TodoistErrorType } from "../errors/types";
import { AuthError, ParseError } from "../errors/types";
import { TodoistHttpClient } from "../http/client";
import { OAuthTokenResponse } from "./schema";

/**
 * OAuth configuration
 */
export interface OAuthConfig {
	readonly clientId: string;
	readonly redirectUri: string;
	readonly scope?: string;
}

/**
 * AuthService interface
 */
export interface IAuthService {
	/**
	 * Generate OAuth authorization URL
	 * @returns Authorization URL and state for CSRF protection
	 */
	readonly generateAuthUrl: () => Effect.Effect<
		{ url: string; state: string },
		never
	>;

	/**
	 * Exchange authorization code for access token
	 * @param code Authorization code from OAuth callback
	 * @param state State parameter for CSRF validation
	 * @returns Access token
	 */
	readonly exchangeCode: (
		code: string,
		state: string,
	) => Effect.Effect<string, TodoistErrorType>;

	/**
	 * Save token to localStorage
	 * @param token Access token
	 */
	readonly saveToken: (token: string) => Effect.Effect<void, never>;

	/**
	 * Get token from localStorage
	 * @returns Token or undefined if not found
	 */
	readonly getToken: () => Effect.Effect<string | undefined, never>;

	/**
	 * Remove token from localStorage
	 */
	readonly removeToken: () => Effect.Effect<void, never>;

	/**
	 * Check if user is authenticated
	 * @returns true if token exists in localStorage
	 */
	readonly isAuthenticated: () => Effect.Effect<boolean, never>;

	/**
	 * Validate saved state matches callback state (CSRF protection)
	 * @param callbackState State from OAuth callback
	 * @returns true if state is valid
	 */
	readonly validateState: (
		callbackState: string,
	) => Effect.Effect<boolean, never>;
}

/**
 * AuthService Tag
 */
export class AuthService extends Context.Tag("AuthService")<
	AuthService,
	IAuthService
>() {}

/**
 * Storage keys
 */
const TOKEN_KEY = "todoist_token";
const STATE_KEY = "oauth_state";

/**
 * Create AuthService layer
 */
export const AuthServiceLive = (config: OAuthConfig) =>
	Layer.effect(
		AuthService,
		Effect.gen(function* () {
			const httpClient = yield* TodoistHttpClient;

			/**
			 * Generate OAuth authorization URL
			 */
			const generateAuthUrl = (): Effect.Effect<
				{ url: string; state: string },
				never
			> =>
				Effect.sync(() => {
					// Generate random state for CSRF protection
					const state = crypto.randomUUID();

					// Save state to localStorage and sessionStorage
					localStorage.setItem(STATE_KEY, state);
					sessionStorage.setItem(STATE_KEY, state);

					// Build authorization URL
					const params = new URLSearchParams({
						client_id: config.clientId,
						scope: config.scope || "data:read_write,data:delete",
						state,
					});

					const url = `https://todoist.com/oauth/authorize?${params.toString()}`;

					return { url, state };
				});

			/**
			 * Exchange authorization code for access token
			 */
			const exchangeCode = (
				code: string,
				state: string,
			): Effect.Effect<string, TodoistErrorType> =>
				Effect.gen(function* () {
					// Validate state
					const isValidState = yield* validateState(state);
					if (!isValidState) {
						return yield* Effect.fail(
							new AuthError({
								message: "State validation failed (CSRF protection)",
							}),
						);
					}

					// Exchange code for token via proxy
					const response = yield* httpClient.post("/oauth/token", {
						client_id: config.clientId,
						code,
						redirect_uri: config.redirectUri,
					});

					// Parse and validate response
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

					// Save token
					yield* saveToken(tokenResponse.accessToken);

					// Clear state
					localStorage.removeItem(STATE_KEY);
					sessionStorage.removeItem(STATE_KEY);

					return tokenResponse.accessToken;
				});

			/**
			 * Save token to localStorage
			 */
			const saveToken = (token: string): Effect.Effect<void, never> =>
				Effect.sync(() => {
					localStorage.setItem(TOKEN_KEY, token);
				});

			/**
			 * Get token from localStorage
			 */
			const getToken = (): Effect.Effect<string | undefined, never> =>
				Effect.sync(() => {
					return localStorage.getItem(TOKEN_KEY) ?? undefined;
				});

			/**
			 * Remove token from localStorage
			 */
			const removeToken = (): Effect.Effect<void, never> =>
				Effect.sync(() => {
					localStorage.removeItem(TOKEN_KEY);
					localStorage.removeItem(STATE_KEY);
					sessionStorage.removeItem(STATE_KEY);
				});

			/**
			 * Check if user is authenticated
			 */
			const isAuthenticated = (): Effect.Effect<boolean, never> =>
				Effect.gen(function* () {
					const token = yield* getToken();
					return token !== undefined;
				});

			/**
			 * Validate state parameter
			 */
			const validateState = (
				callbackState: string,
			): Effect.Effect<boolean, never> =>
				Effect.sync(() => {
					// Check both localStorage and sessionStorage
					const localState = localStorage.getItem(STATE_KEY);
					const sessionState = sessionStorage.getItem(STATE_KEY);

					// State must exist and match
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
