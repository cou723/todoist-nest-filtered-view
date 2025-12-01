import { HttpApp } from "@effect/platform";
import { RpcServer } from "@effect/rpc";
import { Effect, Layer, Logger, Schema } from "effect";
import { env } from "../config.ts";
import {
  OAuthRevokeRequest,
  OAuthRevokeResponse,
  OAuthRevokeResponseSchema,
  OAuthTokenRequest,
  OAuthTokenResponse,
  OAuthTokenResponseSchema,
  ProxyError,
  ProxyRpc,
} from "./api.ts";

const LoggerLayer = Logger.add(
  Logger.make(({ logLevel, message }) => {
    globalThis.console.log(`[${logLevel.label}] ${message}`);
  }),
);

const toProxyError = (error: unknown): ProxyError =>
  error instanceof ProxyError ? error : new ProxyError({
    message: error instanceof Error ? error.message : "Unknown error",
  });

export const exchangeOAuthToken = (
  payload: OAuthTokenRequest,
): Effect.Effect<OAuthTokenResponse, ProxyError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch("https://todoist.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: payload.client_id,
          client_secret: env.TODOIST_CLIENT_SECRET,
          code: payload.code,
          redirect_uri: payload.redirect_uri,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new ProxyError({
          message: message || `HTTP error ${response.status}`,
          status: response.status,
        });
      }

      const data = await response.json();
      return Schema.decodeUnknownSync(OAuthTokenResponseSchema)(data);
    },
    catch: toProxyError,
  });

export const revokeOAuthToken = (
  payload: OAuthRevokeRequest,
): Effect.Effect<OAuthRevokeResponse, ProxyError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch("https://todoist.com/oauth/revoke_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: payload.client_id,
          client_secret: env.TODOIST_CLIENT_SECRET,
          access_token: payload.access_token,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new ProxyError({
          message: message || `HTTP error ${response.status}`,
          status: response.status,
        });
      }

      return Schema.decodeUnknownSync(OAuthRevokeResponseSchema)({
        success: true,
      });
    },
    catch: toProxyError,
  });

export const RpcLayer = ProxyRpc.toLayer({
  ExchangeOAuthToken: exchangeOAuthToken,
  RevokeOAuthToken: revokeOAuthToken,
}).pipe(Layer.provide(LoggerLayer));

export const RpcWebHandler = RpcServer.toHttpApp(ProxyRpc).pipe(
  Effect.map(HttpApp.toWebHandler),
);
