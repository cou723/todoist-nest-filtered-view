# Todoist タスクリスト

ユーザーの特定の条件に沿ったTodoistのTodoを取得し、そのTodoの親Todoの名前を含めて表示するWebアプリケーションです。

## プロジェクト構成

このプロジェクトは、もともとフロントエンドのみのアプリケーションでしたが、OAuth認証とCORS問題を解決するためにプロキシサーバーを追加し、さらにTodoistの自動化機能を提供するCronサービスを追加した結果、3つのコンポーネントからなるフルスタックアプリケーションになりました。

```
todoist_tasklist/
├── frontend/          # フロントエンドアプリケーション（Lit + TypeScript）
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md      # フロントエンド詳細ドキュメント
├── proxy/             # OAuth認証プロキシサーバー（Deno）
│   ├── main.ts
│   ├── deno.json
│   └── README.md      # プロキシサーバー詳細ドキュメント
├── cron/              # Todoist自動化Cronサービス（Deno）
│   ├── main.ts
│   ├── task-service.ts
│   ├── deno.json
│   ├── README.md      # Cronサービス詳細ドキュメント
│   └── CLAUDE.md      # 開発ガイドライン
└── README.md          # このファイル（プロジェクト全体の説明）
```

### フロントエンド (`frontend/`)

- **技術スタック**: Lit、TypeScript、Vite
- **機能**: TodoistTodoの表示、フィルタリング、OAuth認証UI
- **ポート**: 5173（開発時）
- **詳細**: [`frontend/README.md`](frontend/README.md) を参照

### OAuth認証プロキシ (`proxy/`)

- **技術スタック**: Deno、TypeScript
- **機能**: OAuth認証プロキシ、CORS対応
- **ポート**: 8000（ローカル開発時）
- **デプロイ**: Deno Deploy
- **詳細**: [`proxy/README.md`](proxy/README.md) を参照

### Todoist自動化サービス (`cron/`)

- **技術スタック**: Deno、TypeScript
- **機能**: TodoistTodoの自動タグ管理（@goal、@non-milestoneラベルの自動付与・削除）
- **実行間隔**: 1時間ごと（本番環境）
- **デプロイ**: Deno Deploy（Cron機能使用）
- **詳細**: [`cron/README.md`](cron/README.md) を参照

## なぜプロキシサーバーが必要なのか

1. **CORS問題の解決**: ブラウザからTodoist APIへの直接アクセスはCORSポリシーにより制限されます
2. **OAuth認証の安全性**: クライアントサイドでのOAuthトークン交換を安全に行うため
3. **APIキーの保護**: フロントエンドでクライアントシークレットを露出させないため

## クイックスタート

### 1. 前提条件

- Node.js (18以上) - フロントエンド用
- pnpm - フロントエンドのパッケージ管理
- Deno - プロキシサーバーとCronサービス用

### 2. 環境設定

#### フロントエンド環境変数
```bash
cd frontend
cp .env.example .env
# .envファイルを編集してTodoistのクライアントIDとシークレットを設定
```

#### プロキシサーバー環境変数
```bash
cd proxy
cp .env.example .env
# 必要に応じて.envファイルを編集
```

#### Cronサービス環境変数
```bash
cd cron
cp .env.example .env
# .envファイルを編集してTODOIST_TOKENを設定
```

### 3. 起動手順

#### 方法1: 個別起動
```bash
# ターミナル1: プロキシサーバー起動
cd proxy
./start.sh

# ターミナル2: フロントエンド起動
cd frontend
pnpm install
pnpm run dev
```

#### 方法2: 並行起動（推奨）
```bash
# ルートディレクトリから
cd frontend && pnpm install && cd ..
cd proxy && ./start.sh &
cd frontend && pnpm run dev
```

### 4. アクセス

- フロントエンド: http://localhost:5173
- プロキシサーバー: http://localhost:8000

## デプロイ

### フロントエンド
- Vercel、Netlify、GitHub Pagesなどの静的ホスティングサービス
- 詳細は [`frontend/README.md`](frontend/README.md) を参照

### OAuth認証プロキシ
- Deno Deploy（推奨）
- 詳細は [`proxy/README.md`](proxy/README.md) を参照

### Cronサービス
- Deno Deploy（Cron機能を使用して1時間ごとに実行）
- 環境変数 `TODOIST_TOKEN` の設定が必要
- 詳細は [`cron/README.md`](cron/README.md) を参照

## 開発環境

### VS Code での開発

このプロジェクトはフロントエンドとバックエンドで異なる技術スタックを使用しているため、VS Codeで開発する際は**別々のプロファイル**で開くことを推奨します。

#### プロファイル設定方法

1. **フロントエンド用プロファイル**:
   ```bash
   code frontend/ --profile "Frontend"
   ```
   - 推奨拡張機能: TypeScript、Lit、Vite、ESLint、Prettier
   - Node.js環境での開発

2. **バックエンド用プロファイル**:
   ```bash
   code proxy/ --profile "Backend"
   ```
   - 推奨拡張機能: Deno、TypeScript
   - Deno環境での開発

#### プロファイルを分ける理由

- **拡張機能の競合回避**: Node.jsとDenoの拡張機能が競合することを防ぐ
- **設定の最適化**: 各環境に最適化された設定を適用
- **型チェックの精度向上**: 各環境固有の型定義を正しく認識

### 開発ワークフロー

1. **フロントエンド開発**: `frontend/` ディレクトリをFrontendプロファイルで開いて作業
2. **プロキシサーバー開発**: `proxy/` ディレクトリをBackendプロファイルで開いて作業
3. **Cronサービス開発**: `cron/` ディレクトリをBackendプロファイルで開いて作業
4. **統合テスト**: フロントエンドとプロキシサーバーを起動して動作確認
5. **Cronサービステスト**: ローカルでCronスクリプトを手動実行してテスト

## トラブルシューティング

### よくある問題

1. **CORS エラー**: プロキシサーバーが起動しているか確認
2. **OAuth認証失敗**: 環境変数とTodoist App Consoleの設定を確認
3. **ポート競合**: 他のアプリケーションが同じポートを使用していないか確認

詳細なトラブルシューティングは各ディレクトリのREADMEを参照してください。

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。