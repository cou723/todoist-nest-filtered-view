# Todoist OAuth Proxy (Deno Deploy)

TodoistのOAuth認証をプロキシするDeno Deployアプリケーション。

## 🚀 デプロイ

### 1. Deno Deployアカウント作成

[Deno Deploy](https://deno.com/deploy)でアカウントを作成

### 2. GitHubリポジトリと連携

1. GitHubにコードをプッシュ
2. Deno Deployダッシュボードで「New Project」
3. GitHubリポジトリを選択
4. Entry Point: `proxy/main.ts`

### 3. 環境変数設定

Deno Deployダッシュボードで環境変数を設定：

```
ALLOWED_ORIGIN=https://your-frontend-domain.com
```

### 4. 自動デプロイ

GitHubにプッシュすると自動でデプロイされます。

## 🛠️ ローカル開発

### 1. Denoインストール

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows
irm https://deno.land/install.ps1 | iex
```

### 2. 起動方法

#### 簡単起動（推奨）

```bash
# 起動スクリプトを使用（自動で.envファイル作成、権限チェック等）
./start.sh
```

#### Denoタスクを使用

```bash
# 通常起動
deno task start

# 開発モード（ファイル変更時に自動再起動）
deno task dev

# コードフォーマット
deno task fmt

# リント
deno task lint

# 型チェック
deno task check
```

#### 直接実行

```bash
deno run --allow-net --allow-env --allow-read main.ts
```

ローカルでは `http://localhost:8000/oauth/token` でアクセス可能

### 3. 環境変数設定（ローカル）

```bash
# .envファイルを作成（start.shが自動で作成）
cp .env.example .env

# 必要に応じて編集
nano .env
```

## 📁 ファイル構造

```
proxy/
├── main.ts              # メインサーバーファイル
├── deno.json            # Deno設定
├── .env.example         # 環境変数例
└── README-deno.md       # このファイル
```

## 🔧 エンドポイント

### POST `/oauth/token`

TodoistのOAuthトークン交換をプロキシします。

**リクエスト:**

```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "code": "authorization_code",
  "redirect_uri": "your_redirect_uri"
}
```

**レスポンス:**

```json
{
  "access_token": "your_access_token",
  "token_type": "Bearer"
}
```

### POST `/rpc`

Effect RPC のHTTPエンドポイント。`proxy/rpc/api.ts` で定義した
`ExchangeOAuthToken` / `RevokeOAuthToken` / `CompletedByDate` をNDJSON経由で受け付けます。
クライアントは `@effect/rpc` のHTTPプロトコルクライアントを利用してください。

## 🌐 環境変数

### `ALLOWED_ORIGIN`

CORS設定で許可するオリジンを指定します。

**ローカル開発:**

```bash
export ALLOWED_ORIGIN=http://localhost:5173
deno run --allow-net --allow-env main.ts
```

**Deno Deploy:**

- プロジェクト設定で環境変数を追加
- `ALLOWED_ORIGIN`: `https://your-frontend-domain.com`

## ✨ Deno Deployの利点

- **ゼロ設定**: package.jsonやnode_modules不要
- **高速起動**: コールドスタート時間が短い
- **TypeScript標準**: 追加設定なしでTS使用可能
- **Web標準API**: fetch、URLなどが標準で利用可能
- **無料枠**: 月100,000リクエスト、1GB転送量

## 📝 注意事項

- Deno Deployは10秒のタイムアウト制限があります
- 無料プランでは月100,000リクエストまで
- 本番環境では必ず`ALLOWED_ORIGIN`環境変数を設定してください
- TypeScriptの型チェックはDeno環境で行われます（VSCodeのエラーは無視してOK）
