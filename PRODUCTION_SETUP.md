# プロダクション環境設定ガイド

## 概要

このプロジェクトをプロダクション環境にデプロイする際の設定方法について説明します。

## 環境変数の設定

### フロントエンド (Vercel等)

プロダクション環境では以下の環境変数を設定してください：

```
VITE_TODOIST_CLIENT_ID=your_actual_client_id
VITE_PROXY_URL=https://your-proxy-domain.com
```

**重要**: `VITE_PROXY_URL`を設定しない場合、デフォルトで`http://localhost:8000`が使用されるため、プロダクション環境では必ず設定してください。

### プロキシサーバー

プロキシサーバーの環境変数も適切に設定してください：

```
ALLOWED_ORIGIN=https://your-frontend-domain.com
TODOIST_CLIENT_SECRET=your_actual_client_secret
```

## Vercelでの設定例

1. Vercelダッシュボードでプロジェクトを選択
2. Settings → Environment Variables に移動
3. 以下の変数を追加：
   - `VITE_TODOIST_CLIENT_ID`: TodoistアプリのクライアントID
   - `VITE_PROXY_URL`: プロキシサーバーのURL（例: `https://your-proxy.vercel.app`）

## 修正内容

### 問題
- フロントエンドが`http://localhost:8000`にハードコードされていた
- プロダクション環境でもlocalhostに通信しようとしていた

### 解決策
- `VITE_PROXY_URL`環境変数を導入
- `oauth-service.ts`でハードコードされたURLを環境変数に変更
- 開発環境では従来通り`localhost:8000`を使用
- プロダクション環境では適切なプロキシサーバーURLを使用

### 変更されたファイル
- `frontend/.env.example`: `VITE_PROXY_URL`を追加
- `frontend/src/services/oauth-service.ts`: ハードコードされたURLを環境変数に変更

## 動作確認

1. 開発環境: `VITE_PROXY_URL`が未設定でも`localhost:8000`で動作
2. プロダクション環境: `VITE_PROXY_URL`を設定することで適切なプロキシサーバーに通信

これにより、プロダクション環境でlocalhost:5173への不正な通信を防ぐことができます。