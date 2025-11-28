import { Effect } from "effect";
import type { OAuthService } from "../oAuthService";

interface LogoutDeps {
	readonly oauthService: Pick<
		OAuthService,
		"revokeToken" | "clearToken" | "clearState"
	>;
	readonly token: string | null;
}

export function logout({
	oauthService,
	token,
}: LogoutDeps): Effect.Effect<void, Error> {
	const revokeEffect = token
		? oauthService.revokeToken(token)
		: Effect.succeed(undefined);

	return Effect.ensuring(
		revokeEffect,
		Effect.sync(() => {
			oauthService.clearToken();
			oauthService.clearState();
		}),
	);
}
