import type { OAuthService } from "../oAuthService";

interface StartOAuthDeps {
	readonly oauthService: Pick<
		OAuthService,
		"generateState" | "getAuthorizeUrl"
	>;
	readonly redirect: (url: string) => void;
}

export function startOAuth({ oauthService, redirect }: StartOAuthDeps): void {
	const state = oauthService.generateState();
	const authorizeUrl = oauthService.getAuthorizeUrl(state);
	redirect(authorizeUrl);
}
