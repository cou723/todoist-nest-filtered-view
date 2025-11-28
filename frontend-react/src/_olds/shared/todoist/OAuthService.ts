import {
	getAuthorizationUrl,
	getAuthStateParameter,
	type Permission,
} from "@doist/todoist-api-typescript";
import { callProxyRpc } from "../../../features/auth/__application/apiClient";

export interface OAuthConfig {
	readonly clientId: string;
	readonly redirectUri: string;
	readonly permissions: Permission[];
}

export interface OAuthExchangeResult {
	readonly accessToken: string;
	readonly tokenType: string;
}

const OAUTH_STATE_KEY = "oauth_state";
const TOKEN_KEY = "todoist_token";

export class OAuthService {
	private readonly config: OAuthConfig;
	private readonly localStorage: Storage;
	private readonly sessionStorage: Storage;

	constructor(config: OAuthConfig, localStorage: Storage, sessionStorage: Storage) {
		this.config = config;
		this.localStorage = localStorage;
		this.sessionStorage = sessionStorage;
	}

	generateState(): string {
		const state = getAuthStateParameter();
		this.localStorage.setItem(OAUTH_STATE_KEY, state);
		sessionStorage.setItem(OAUTH_STATE_KEY, state);
		return state;
	}

	buildAuthorizeUrl(state: string): string {
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

	redirectToAuthorize(): void {
		const state = this.generateState();
		const authUrl = this.buildAuthorizeUrl(state);
		window.location.assign(authUrl);
	}

	clearState(): void {
		this.localStorage.removeItem(OAUTH_STATE_KEY);
		this.sessionStorage.removeItem(OAUTH_STATE_KEY);
	}

	validateState(state?: string | null): void {
		const savedState =
			this.localStorage.getItem(OAUTH_STATE_KEY) ||
			this.sessionStorage.getItem(OAUTH_STATE_KEY);

		if (!state) {
			throw new Error("state パラメータが見つかりません");
		}

		if (savedState && savedState !== state) {
			throw new Error("state が一致しません");
		}
	}

	extractAuthParams(url: string): {
		code?: string;
		state?: string;
		error?: string;
	} {
		const urlObj = new URL(url);
		return {
			code: urlObj.searchParams.get("code") ?? undefined,
			state: urlObj.searchParams.get("state") ?? undefined,
			error: urlObj.searchParams.get("error") ?? undefined,
		};
	}

	async exchangeCodeForToken(
		code: string,
		state?: string | null,
	): Promise<OAuthExchangeResult> {
		console.log("Exchanging code for token...");
		this.validateState(state);
		this.clearState();

		try {
			const raw = await callProxyRpc((client) =>
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
		} catch (error) {
			throw error instanceof Error ? error : new Error("トークン交換に失敗しました");
		}
	}

	async revokeToken(token: string): Promise<void> {
		try {
			await callProxyRpc((client) =>
				client.RevokeOAuthToken({
					client_id: this.config.clientId,
					access_token: token,
				}),
			);
		} catch (error) {
			throw error instanceof Error ? error : new Error("トークン無効化に失敗しました");
		}
	}

	getStoredToken(): string | null {
		return this.localStorage.getItem(TOKEN_KEY);
	}

	clearToken(): void {
		this.localStorage.removeItem(TOKEN_KEY);
	}
}
