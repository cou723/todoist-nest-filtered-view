import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export type SchemaType<S extends { Type: unknown }> = S["Type"];

export class ProxyError extends Schema.TaggedError<ProxyError>()(
  "ProxyError",
  {
    message: Schema.String,
    status: Schema.optional(Schema.Number),
  },
) {}

export const OAuthTokenRequestSchema = Schema.Struct({
  client_id: Schema.NonEmptyString,
  code: Schema.NonEmptyString,
  redirect_uri: Schema.NonEmptyString,
});

export const OAuthTokenResponseSchema = Schema.Struct({
  access_token: Schema.String,
  token_type: Schema.String,
});

export type OAuthTokenRequest = SchemaType<typeof OAuthTokenRequestSchema>;
export type OAuthTokenResponse = SchemaType<typeof OAuthTokenResponseSchema>;

export const OAuthRevokeRequestSchema = Schema.Struct({
  client_id: Schema.NonEmptyString,
  access_token: Schema.NonEmptyString,
});

export const OAuthRevokeResponseSchema = Schema.Struct({
  success: Schema.Boolean,
});

export type OAuthRevokeRequest = SchemaType<typeof OAuthRevokeRequestSchema>;
export type OAuthRevokeResponse = SchemaType<typeof OAuthRevokeResponseSchema>;

export const CompletedByDateRequestSchema = Schema.Struct({
  authorization: Schema.NonEmptyString,
  query: Schema.optionalWith(
    Schema.Record({
      key: Schema.String,
      value: Schema.String,
    }),
    { default: () => ({}) },
  ),
});

export class ProxyRpc extends RpcGroup.make(
  Rpc.make("ExchangeOAuthToken", {
    error: ProxyError,
    success: OAuthTokenResponseSchema,
    payload: OAuthTokenRequestSchema,
  }),
  Rpc.make("RevokeOAuthToken", {
    error: ProxyError,
    success: OAuthRevokeResponseSchema,
    payload: OAuthRevokeRequestSchema,
  })
) {}
