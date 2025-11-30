import { Schema as S } from "@effect/schema";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import { Effect } from "effect";
import type { getEnv } from "@/features/env/application/usecase/getEnv";

const EnvSchema = S.Struct({
	VITE_TODOIST_CLIENT_ID: S.NonEmptyTrimmedString,
	VITE_TODOIST_REDIRECT_URI: S.NonEmptyTrimmedString,
	VITE_PROXY_URL: S.NonEmptyTrimmedString,
	VITE_USE_MOCK_CLIENT: S.Union(S.Literal("true"), S.Literal("false")),
});

export const getEnvImpl: getEnv = () =>
	Effect.runSync(
		S.decodeUnknown(EnvSchema)(import.meta.env).pipe(
			Effect.mapError(
				(error) =>
					// ここでのバリデーションエラーは致命的で、エラーとしてはバグに分類される。そのためフェイルファストの原則に従い、ここで例外を投げる。
					new Error(
						`Environment variables validation failed: ${TreeFormatter.formatErrorSync(error)}`,
					),
			),
			Effect.map((env) => ({
				VITE_TODOIST_CLIENT_ID: env.VITE_TODOIST_CLIENT_ID,
				VITE_TODOIST_REDIRECT_URI: env.VITE_TODOIST_REDIRECT_URI,
				VITE_PROXY_URL: env.VITE_PROXY_URL,
				VITE_USE_MOCK_CLIENT: env.VITE_USE_MOCK_CLIENT === "true",
			})),
		),
	);
