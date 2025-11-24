import {
	type AuthTokenResponse,
	getAuthorizationUrl,
	getAuthStateParameter,
	type Permission,
} from "@doist/todoist-api-typescript";

export interface OAuthConfig {
	readonly clientId: string;
	readonly redirectUri: string;
	readonly proxyUrl: string;
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
	constructor(config: OAuthConfig) {
		this.config = config;
	}

	generateState(): string {
		const state = getAuthStateParameter();
		localStorage.setItem(OAUTH_STATE_KEY, state);
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
		localStorage.removeItem(OAUTH_STATE_KEY);
		sessionStorage.removeItem(OAUTH_STATE_KEY);
	}

	validateState(state?: string | null): void {
		const savedState =
			localStorage.getItem(OAUTH_STATE_KEY) ||
			sessionStorage.getItem(OAUTH_STATE_KEY);

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

		const requestUrl = `${this.config.proxyUrl}/oauth/token`;

		const response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: this.config.clientId,
				code,
				redirect_uri: this.config.redirectUri,
			}),
		});

		if (!response.ok) {
			const message = await response.text();
			throw new Error(
				`トークン交換に失敗しました (status: ${response.status}) ${message}`,
			);
		}

		const raw = (await response.json()) as
			| AuthTokenResponse
			| { access_token?: string; token_type?: string };

		const accessToken =raw.access_token;
			// (raw as AuthTokenResponse).accessToken ?? raw.access_token ?? "";
		const tokenType = (raw as AuthTokenResponse).tokenType ?? raw.token_type;

		if (!accessToken) {
			throw new Error("アクセストークンを取得できませんでした");
		}

		localStorage.setItem(TOKEN_KEY, accessToken);

		return {
			accessToken,
			tokenType: tokenType ?? "Bearer",
		};
	}

	async revokeToken(token: string): Promise<void> {
		const requestUrl = `${this.config.proxyUrl}/oauth/revoke`;
		const response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: this.config.clientId,
				access_token: token,
			}),
		});

		if (!response.ok) {
			const message = await response.text();
			throw new Error(
				`トークン無効化に失敗しました (status: ${response.status}) ${message}`,
			);
		}
	}

	getStoredToken(): string | null {
		return localStorage.getItem(TOKEN_KEY);
	}

	clearToken(): void {
		localStorage.removeItem(TOKEN_KEY);
	}
}
