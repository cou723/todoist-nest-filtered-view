import {
	getAuthorizationUrl,
	getAuthStateParameter,
} from "@doist/todoist-api-typescript";
import { Effect } from "effect";
import type {
	OAuthConfig,
	OAuthExchangeResult,
	OAuthService,
} from "@/features/auth/application";
import { callProxyRpc } from "@/features/auth/infrastructure/client";

const OAUTH_STATE_KEY = "oauth_state";
const TOKEN_KEY = "todoist_token";

export class OAuthServiceLive implements OAuthService {
	private readonly config: OAuthConfig;
	private readonly localStorage: Storage;
	private readonly sessionStorage: Storage;

	constructor(
		config: OAuthConfig,
		localStorage: Storage,
		sessionStorage: Storage,
	) {
		this.config = config;
		this.localStorage = localStorage;
		this.sessionStorage = sessionStorage;
	}

	generateState(): string {
		const state = getAuthStateParameter();
		this.localStorage.setItem(OAUTH_STATE_KEY, state);
		this.sessionStorage.setItem(OAUTH_STATE_KEY, state);
		return state;
	}

	getAuthorizeUrl(state: string): string {
		const baseUrl = getAuthorizationUrl({
			clientId: this.config.clientId,
			permissions: this.config.permissions,
			state,
		});

		const url = new URL(baseUrl);
		url.searchParams.set("redirect_uri", this.config.redirectUri);
		url.searchParams.set("response_type", "code");

		return url.toString();
	}

	clearState(): void {
		this.localStorage.removeItem(OAUTH_STATE_KEY);
		this.sessionStorage.removeItem(OAUTH_STATE_KEY);
	}

	validateState(state: string): Effect.Effect<void, Error> {
		const savedState =
			this.localStorage.getItem(OAUTH_STATE_KEY) ||
			this.sessionStorage.getItem(OAUTH_STATE_KEY);
		if (savedState && savedState !== state) {
			return Effect.fail(new Error("state が一致しません"));
		}
		return Effect.succeedNone;
	}

	getToken(
		code: string,
		state: string,
	): Effect.Effect<OAuthExchangeResult, Error> {
		return Effect.gen(this, function* () {
			console.log("Exchanging code for token...");
			yield* this.validateState(state);
			this.clearState();
			const raw = yield* callProxyRpc((client) =>
				client.ExchangeOAuthToken({
					client_id: this.config.clientId,
					code,
					redirect_uri: this.config.redirectUri,
				}),
			);

			this.localStorage.setItem(TOKEN_KEY, raw.access_token);
			return {
				accessToken: raw.access_token,
				tokenType: raw.token_type,
			};
		});
	}

	revokeToken(token: string): Effect.Effect<void, Error> {
		return callProxyRpc((client) =>
			client.RevokeOAuthToken({
				client_id: this.config.clientId,
				access_token: token,
			}),
		);
	}

	getStoredToken(): string | null {
		return this.localStorage.getItem(TOKEN_KEY);
	}

	clearToken(): void {
		this.localStorage.removeItem(TOKEN_KEY);
	}
}
