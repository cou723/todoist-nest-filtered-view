import { Schema as S } from "@effect/schema";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import { Effect } from "effect";

const EnvSchema = S.Struct({
	VITE_TODOIST_CLIENT_ID: S.NonEmptyTrimmedString,
	VITE_TODOIST_REDIRECT_URI: S.NonEmptyTrimmedString,
	VITE_PROXY_URL: S.NonEmptyTrimmedString,
	VITE_USE_MOCK_CLIENT: S.Union(
		S.Literal("true"),
		S.Literal("false"),
	),
});

const validatedEnv = Effect.runSync(
	S.decodeUnknown(EnvSchema)({
		VITE_TODOIST_CLIENT_ID: import.meta.env.VITE_TODOIST_CLIENT_ID,
		VITE_TODOIST_REDIRECT_URI: import.meta.env.VITE_TODOIST_REDIRECT_URI,
		VITE_PROXY_URL: import.meta.env.VITE_PROXY_URL,
		VITE_USE_MOCK_CLIENT: import.meta.env.VITE_USE_MOCK_CLIENT,
	}).pipe(
		Effect.mapError(
			(error) =>
				new Error(
					`Environment variables validation failed: ${TreeFormatter.formatErrorSync(error)}`,
				),
		),
	),
);

const env = {
	...validatedEnv,
	VITE_USE_MOCK_CLIENT:
		validatedEnv.VITE_USE_MOCK_CLIENT === "true",
} as const;

export type Env = typeof env;

export const useEnv = (): Env => env;
export const getEnv = (): Env => env;
