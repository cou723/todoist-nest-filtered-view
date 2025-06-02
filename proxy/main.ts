// Deno Deploy用のOAuthプロキシサーバー
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface OAuthRequest {
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
}

interface OAuthResponse {
  access_token: string;
  token_type: string;
}

// 環境変数からoriginを取得（デフォルトはlocalhost:5173）
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ||
  "http://localhost:5173";

function setCorsHeaders(headers: Headers): void {
  headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
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
    const body: OAuthRequest = await request.json();
    const { client_id, client_secret, code, redirect_uri } = body;

    // 必要なパラメータの検証
    if (!client_id || !client_secret || !code || !redirect_uri) {
      headers.set("Content-Type", "application/json");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers },
      );
    }

    // TodoistのOAuth APIを呼び出し
    const response = await fetch("https://todoist.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        code,
        redirect_uri,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OAuthResponse = await response.json();
    headers.set("Content-Type", "application/json");

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

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // OAuth トークン交換エンドポイント
  if (url.pathname === "/oauth/token") {
    return handleOAuthToken(request);
  }

  // 404 Not Found
  return new Response("Not Found", { status: 404 });
}

// サーバー起動
console.log("🚀 Deno プロキシサーバーが起動しました");
console.log(`🌐 CORS Origin: ${ALLOWED_ORIGIN}`);

serve(handler);
