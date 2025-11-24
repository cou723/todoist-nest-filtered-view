# フロントエンド認証設計：OAuth コードフロー（プロキシ経由）

## 背景と目的
- v1 Completed API で CORS を解消するため、プロキシ経由の OAuth コードフローを復活させる。
- クライアントシークレットはフロントに置かず、Deno Deploy 上の `proxy/main.ts` に集約。
- 既存の Effect ベースのサービス層を温存しつつ、認証は公式 SDK で state 生成を行う。

## フロー概要
1. 「Todoistでログイン」クリックで `getAuthStateParameter()` で生成した state を localStorage / sessionStorage に保存し、`https://todoist.com/oauth/authorize` へリダイレクト（scope は `VITE_TODOIST_PERMISSIONS`）。
2. Todoist から `redirect_uri`（例: `/callback`）へ `code` と `state` が返る。
3. フロントは state を検証した上で、プロキシの `/oauth/token` に `client_id`/`code`/`redirect_uri` を POST。返却された `access_token` を `todoist_token` として保存。
4. 認証済み表示時はヘッダーにトークン末尾のみを表示し、`/oauth/revoke` を叩いてログアウト（失敗時もローカルのトークンは必ず削除）。
5. デバッグ用にアクセストークン手動入力フォームを非デフォルトのフォールバックとして保持。

## ストレージキー
- `todoist_token`: アクセストークン
- `oauth_state`: CSRF 対策用 state（localStorage / sessionStorage 両方）

## API 経路
- v1 Completed API: `VITE_PROXY_URL/v1/tasks/completed/by_completion_date`（Authorization ヘッダーを付与）
- REST v2: これまでどおり直接呼び出し。CORS 問題が出る場合はプロキシ経由に切り替え検討。
