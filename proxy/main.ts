// Deno Deploy用のOAuthプロキシサーバー
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface OAuthTokenRequest {
  client_id: string;
  code: string;
  redirect_uri: string;
}

interface OAuthRevokeRequest {
  client_id: string;
  access_token: string;
}

interface OAuthResponse {
  access_token: string;
  token_type: string;
}

// 環境変数からoriginを取得（デフォルトはlocalhost:5173）
const ALLOWED_ORIGIN =
  Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173";

// 環境変数からTodoist Client Secretを取得
const TODOIST_CLIENT_SECRET = Deno.env.get("TODOIST_CLIENT_SECRET");

if (!TODOIST_CLIENT_SECRET) {
  console.error("❌ TODOIST_CLIENT_SECRET environment variable is required");
  Deno.exit(1);
}

function setCorsHeaders(headers: Headers): void {
  headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
}

async function handleOAuthToken(request: Request): Promise<Response> {
  const headers = new Headers();

  setCorsHeaders(headers);

  // プリフライトリクエストの処理
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  // POSTメソッドのみ許可
  if (request.method !== "POST") {
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const body: OAuthTokenRequest = await request.json();
    const { client_id, code, redirect_uri } = body;

    // 必要なパラメータの検証
    if (!client_id || !code || !redirect_uri) {
      headers.set("Content-Type", "application/json");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers }
      );
    }

    // TodoistのOAuth APIを呼び出し（サーバー側でclient_secretを使用）
    const response = await fetch("https://todoist.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret: TODOIST_CLIENT_SECRET!,
        code,
        redirect_uri,
      }),
    });

    const data = await response.json();
    headers.set("Content-Type", "application/json");

    // Todoistからのレスポンスをそのまま返す（エラーも含む）
    if (!response.ok) {
      console.error("❌ [Proxy] Todoist OAuth error:", response.status, data);
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("❌ [Proxy] エラー:", error);
    headers.set("Content-Type", "application/json");

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers,
    });
  }
}

async function handleOAuthRevoke(request: Request): Promise<Response> {
  const headers = new Headers();
  setCorsHeaders(headers);

  // プリフライトリクエストの処理
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  // POSTメソッドのみ許可
  if (request.method !== "POST") {
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const body: OAuthRevokeRequest = await request.json();
    const { client_id, access_token } = body;

    // 必要なパラメータの検証
    if (!client_id || !access_token) {
      headers.set("Content-Type", "application/json");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers }
      );
    }

    // TodoistのOAuth revoke APIを呼び出し
    const response = await fetch("https://todoist.com/oauth/revoke_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret: TODOIST_CLIENT_SECRET!,
        access_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("❌ [Proxy] Revoke エラー:", error);
    headers.set("Content-Type", "application/json");

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers,
    });
  }
}

// v1 Completed by completion date 中継
async function handleCompletedByDate(request: Request): Promise<Response> {
  const headers = new Headers();
  setCorsHeaders(headers);

  // プリフライト
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== "GET") {
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization");
    if (!auth) {
      headers.set("Content-Type", "application/json");
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers,
      });
    }

    // そのままクエリを転送
    const upstream = new URL(
      "https://api.todoist.com/api/v1/tasks/completed/by_completion_date"
    );
    url.searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

    const resp = await fetch(upstream, {
      method: "GET",
      headers: {
        Authorization: auth,
      },
    });

    const body = await resp.text();
    headers.set("Content-Type", "application/json");
    return new Response(body, { status: resp.status, headers });
  } catch (error) {
    console.error("❌ [Proxy] CompletedByDate エラー:", error);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers,
    });
  }
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // OAuth トークン交換エンドポイント
  if (url.pathname === "/oauth/token") {
    return handleOAuthToken(request);
  }

  // OAuth トークン無効化エンドポイント
  if (url.pathname === "/oauth/revoke") {
    return handleOAuthRevoke(request);
  }

  // v1 Completed by completion date 中継
  if (url.pathname === "/v1/tasks/completed/by_completion_date") {
    return handleCompletedByDate(request);
  }

  // 404 Not Found
  return new Response("Not Found", { status: 404 });
}

// サーバー起動
serve(handler);
