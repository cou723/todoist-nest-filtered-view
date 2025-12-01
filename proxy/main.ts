import { RpcSerialization } from "@effect/rpc";
import { Effect, Layer } from "effect";
import * as Runtime from "effect/Runtime";
import { env } from "./config.ts";
import { ProxyError } from "./rpc/api.ts";
import { RpcLayer, RpcWebHandler } from "./rpc/server.ts";

const RpcRuntimeLayer = Layer.mergeAll(RpcSerialization.layerNdjson, RpcLayer);
const rpcRuntime = await Effect.runPromise(
  Layer.toRuntime(RpcRuntimeLayer).pipe(Effect.scoped),
);

const allowedOrigin = env.ALLOWED_ORIGIN.replace(/\/$/, "");

const buildCorsHeaders = (request: Request): Headers | null => {
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (!origin || origin !== allowedOrigin) return null;

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, traceparent, tracestate",
  );
  headers.set("Vary", "Origin");
  return headers;
};

const withCors = (request: Request, response: Response): Response => {
  const headers = buildCorsHeaders(request);
  if (!headers) {
    return new Response("Forbidden", { status: 403 });
  }

  response.headers.forEach((value, key) => headers.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const preflightResponse = (request: Request): Response => {
  const headers = buildCorsHeaders(request);
  if (!headers) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(null, { status: 200, headers });
};

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

const handleRpc = (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return new Promise((r) =>
      r(jsonResponse({ error: "Method not allowed" }, 405))
    );
  }

  return Runtime.runPromise(rpcRuntime)(
    RpcWebHandler.pipe(
      Effect.flatMap((handler) => Effect.tryPromise(() => handler(request))),
      Effect.scoped,
    ),
  ).catch(handleError);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return preflightResponse(request);
  }

  const url = new URL(request.url);
  switch (url.pathname) {
    case "/rpc":
      console.log("[Proxy] Handling RPC request");
      return withCors(request, await handleRpc(request));
    default:
      return withCors(
        request,
        new Response("Not Found", {
          status: 404,
          headers: new Headers({ "Content-Type": "text/plain" }),
        }),
      );
  }
});
