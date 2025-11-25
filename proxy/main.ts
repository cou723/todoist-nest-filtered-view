import { Effect, Exit, Schema } from "effect";
import { env } from "./config.ts";
import {
  CompletedByDateRequestSchema,
  OAuthRevokeRequestSchema,
  OAuthTokenRequestSchema,
  ProxyError,
} from "./rpc/api.ts";
import {
  exchangeOAuthToken,
  fetchCompletedByDate,
  revokeOAuthToken,
  RpcWebHandler,
} from "./rpc/server.ts";
import { pipe } from "effect/Function";

const rpcHandler = await Effect.runPromise(RpcWebHandler.pipe(Effect.scoped));

const buildCorsHeaders = (): Headers => {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return headers;
};

const withCors = (response: Response): Response => {
  const headers = buildCorsHeaders();
  response.headers.forEach((value, key) => headers.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const preflightResponse = (): Response =>
  new Response(null, { status: 200, headers: buildCorsHeaders() });

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: new Headers({ "Content-Type": "application/json" }),
  });

const handleError = (error: unknown): Response => {
  if (error instanceof ProxyError) {
    return jsonResponse({ error: error.message }, error.status ?? 400);
  }

  console.error("❌ [Proxy] Unexpected error:", error);
  return jsonResponse({ error: "Internal Server Error" }, 500);
};

const runProxyEffect = async <A>(
  effect: Effect.Effect<A, ProxyError>,
): Promise<Response> => {
  return Exit.match(await Effect.runPromiseExit(effect), {
    onSuccess: jsonResponse,
    onFailure: handleError,
  });
};

const toProxyErrorEffect = <A, E>(
  effect: Effect.Effect<A, E>,
): Effect.Effect<A, ProxyError> =>
  pipe(
    effect,
    Effect.mapError((error) =>
      error instanceof ProxyError ? error : new ProxyError({
        message: error instanceof Error
          ? error.message
          : "Invalid request body",
        status: 400,
      })
    ),
  );

function requestBodyToJson(
  request: Request,
): Effect.Effect<unknown, ProxyError> {
  return Effect.tryPromise({
    try: async () => {
      const bodyText = await request.text();
      return JSON.parse(bodyText);
    },
    catch: (error) => {
      if (error instanceof SyntaxError) {
        return new ProxyError({
          message: "Invalid JSON body: " + error.message,
          status: 400,
        });
      }
      return new ProxyError({
        message: "Failed to parse JSON body: " + error,
        status: 400,
      });
    },
  });
}

const handleOAuthToken = async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return runProxyEffect(
    Effect.gen(function* () {
      const unknownPayload = yield* requestBodyToJson(request);
      const payload = yield* Schema.decodeUnknown(OAuthTokenRequestSchema)(
        unknownPayload,
      ).pipe(toProxyErrorEffect);
      return yield* exchangeOAuthToken(payload);
    }),
  );
};

const handleOAuthRevoke = async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  return runProxyEffect(
    Effect.gen(function* () {
      const unknownPayload = yield* requestBodyToJson(request);
      const payload = yield* Schema.decodeUnknown(OAuthRevokeRequestSchema)(
        unknownPayload,
      )
        .pipe(toProxyErrorEffect);
      return yield* revokeOAuthToken(payload);
    }),
  );
};

const handleCompletedByDate = async (request: Request): Promise<Response> => {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return runProxyEffect(
    Effect.gen(function* () {
      const authorization = request.headers.get("Authorization");
      if (!authorization) {
        return yield* Effect.fail(
          new ProxyError({
            message: "Missing Authorization",
            status: 401,
          }),
        );
      }

      const payload = yield* toProxyErrorEffect(
        Schema.decodeUnknown(CompletedByDateRequestSchema)({
          authorization,
          query,
        }),
      );
      return yield* fetchCompletedByDate(payload);
    }),
  );
};

const handleRpc = async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const response = await rpcHandler(request);
    return response;
  } catch (error) {
    return handleError(error);
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return preflightResponse();
  }

  const url = new URL(request.url);
  switch (url.pathname) {
    case "/rpc":
      return withCors(await handleRpc(request));
    case "/oauth/token":
      return withCors(await handleOAuthToken(request));
    case "/oauth/revoke":
      return withCors(await handleOAuthRevoke(request));
    case "/v1/tasks/completed/by_completion_date":
      return withCors(
        await handleCompletedByDate(request),
      );
    default:
      return withCors(
        new Response("Not Found", {
          status: 404,
          headers: new Headers({ "Content-Type": "text/plain" }),
        }),
      );
  }
});
