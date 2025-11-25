import { HttpApp } from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Effect, Layer, Logger, Schema } from "effect";
import { env } from "../config.ts";
import {
  CompletedByDateRequest,
  CompletedByDateResponse,
  CompletedByDateResponseSchema,
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

export const fetchCompletedByDate = (
  payload: CompletedByDateRequest,
): Effect.Effect<CompletedByDateResponse, ProxyError> =>
  Effect.tryPromise({
    try: async () => {
      const upstream = new URL(
        "https://api.todoist.com/api/v1/tasks/completed/by_completion_date",
      );
      Object.entries(payload.query ?? {}).forEach(([key, value]) => {
        upstream.searchParams.set(key, value);
      });

      const response = await fetch(upstream, {
        method: "GET",
        headers: { Authorization: payload.authorization },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ProxyError({
          message: typeof data === "string"
            ? data
            : JSON.stringify(data, null, 2),
          status: response.status,
        });
      }

      return Schema.decodeUnknownSync(CompletedByDateResponseSchema)(data);
    },
    catch: toProxyError,
  });

const RpcLayer = ProxyRpc.toLayer({
  ExchangeOAuthToken: exchangeOAuthToken,
  RevokeOAuthToken: revokeOAuthToken,
  CompletedByDate: fetchCompletedByDate,
}).pipe(Layer.provide(LoggerLayer));

export const RpcWebHandler = RpcServer.toHttpApp(ProxyRpc).pipe(
  Effect.map(HttpApp.toWebHandler),
  Effect.provide([RpcLayer, RpcSerialization.layerNdjson]),
);
