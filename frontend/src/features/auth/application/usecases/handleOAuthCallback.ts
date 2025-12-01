import { Effect, Schema as S } from "effect";
import type { OAuthService } from "@/features/auth/application";

const CallbackParamsSchema = S.Struct({
	code: S.NonEmptyString,
	state: S.NonEmptyString,
});

interface OAuthCallbackResult {
	readonly code: string;
	readonly state: string;
}

export function handleOAuthCallback(
	href: string,
	oauthService: Pick<OAuthService, "clearToken">,
): Effect.Effect<OAuthCallbackResult, Error> {
	return Effect.gen(function* () {
		const url = new URL(href);
		const error = url.searchParams.get("error");
		if (error) {
			return yield* Effect.fail(new Error(error));
		}

		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");

		return S.decodeUnknownSync(CallbackParamsSchema)({ code, state });
	}).pipe(
		Effect.mapError((e) => {
			oauthService.clearToken();
			return e;
		}),
	);
}
