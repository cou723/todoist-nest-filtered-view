import type { Permission } from "@doist/todoist-api-typescript";
import type { Effect } from "effect";

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
	getAuthorizeUrl(state: string): string;
	clearState(): void;

	getToken(
		code: string,
		state: string,
	): Effect.Effect<OAuthExchangeResult, Error>;

	revokeToken(token: string): Effect.Effect<void, Error>;
	getStoredToken(): string | null;
	clearToken(): void;
}
