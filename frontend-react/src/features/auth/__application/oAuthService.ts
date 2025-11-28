import type { Permission } from "@doist/todoist-api-typescript";

export interface OAuthConfig {
	readonly clientId: string;
	readonly redirectUri: string;
	readonly permissions: Permission[];
}

export interface OAuthExchangeResult {
	readonly accessToken: string;
	readonly tokenType: string;
}

export interface OAuthService {
	generateState(): string;

	buildAuthorizeUrl(state: string): string;

	redirectToAuthorize(): void;

	clearState(): void;

	validateState(state?: string | null): void;

	extractAuthParams(url: string): {
		code?: string;
		state?: string;
		error?: string;
	};
	exchangeCodeForToken(
		code: string,
		state?: string | null,
	): Promise<OAuthExchangeResult>;

	revokeToken(token: string): Promise<void>;
	getStoredToken(): string | null;
	clearToken(): void;
}
