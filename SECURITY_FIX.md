# セキュリティ修正: OAuth Client Secret の適切な管理

## 修正前の問題

### 重大なセキュリティ脆弱性
- **Client Secret がフロントエンドに露出**: `VITE_TODOIST_CLIENT_SECRET` 環境変数により、OAuth Client Secret がブラウザで閲覧可能
- **認証情報の漏洩リスク**: 悪意のあるユーザーがアプリケーションになりすまし可能
- **API 悪用の可能性**: 第三者があなたのクライアント認証情報を使用してトークンを取得可能

## 修正内容

### 1. フロントエンド側の変更
- `frontend/src/config/oauth-config.ts`: Client Secret の参照を削除
- `frontend/src/services/oauth-service.ts`: OAuthConfig インターフェースから clientSecret を削除
- `frontend/.env.example`: VITE_TODOIST_CLIENT_SECRET を削除

### 2. プロキシサーバー側の変更
- `proxy/main.ts`: サーバー側で Client Secret を管理
- 環境変数 `TODOIST_CLIENT_SECRET` からシークレットを取得
- トークン交換とトークン無効化の両方でサーバー側シークレットを使用
- `proxy/.env.example`: TODOIST_CLIENT_SECRET の設定例を追加

## セットアップ手順

### 1. プロキシサーバーの環境変数設定
```bash
# proxy/.env ファイルを作成
cp proxy/.env.example proxy/.env

# TODOIST_CLIENT_SECRET に実際の値を設定
echo "TODOIST_CLIENT_SECRET=your_actual_client_secret_here" >> proxy/.env
```

### 2. フロントエンドの環境変数設定
```bash
# frontend/.env ファイルを作成（Client Secret は不要）
cp frontend/.env.example frontend/.env

# CLIENT_ID のみ設定
echo "VITE_TODOIST_CLIENT_ID=your_actual_client_id_here" >> frontend/.env
```

## セキュリティの改善点

### ✅ 修正後の安全な実装
- **Client Secret はサーバー側のみ**: プロキシサーバーの環境変数で管理
- **フロントエンドには公開されない**: ブラウザからアクセス不可
- **適切な責任分離**: 認証フローでクライアントとサーバーの役割を明確化

### 🔒 追加のセキュリティ対策
- CORS 設定により許可されたオリジンのみアクセス可能
- プロキシサーバーでの入力検証
- エラーハンドリングの改善

## 注意事項

1. **既存の .env ファイルの更新**: 既存の環境設定ファイルから `VITE_TODOIST_CLIENT_SECRET` を削除してください
2. **デプロイ環境の設定**: 本番環境でも `TODOIST_CLIENT_SECRET` をプロキシサーバーの環境変数として設定してください
3. **Client Secret の管理**: Client Secret は絶対にフロントエンドコードやリポジトリにコミットしないでください

## 検証方法

修正後、以下を確認してください：

1. **ブラウザの開発者ツール**: ソースコードに Client Secret が含まれていないことを確認
2. **ネットワークタブ**: フロントエンドからの API リクエストに Client Secret が含まれていないことを確認
3. **OAuth フロー**: 認証が正常に動作することを確認

この修正により、OAuth Client Secret が適切に保護され、セキュリティリスクが大幅に軽減されます。