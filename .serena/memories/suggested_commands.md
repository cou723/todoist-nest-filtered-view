# 推奨コマンド集

## 日常開発で最も使用するコマンド

### 開発環境の起動
```bash
# 最も推奨: フロントエンドとプロキシの同時起動
./dev.sh

# または個別起動
cd frontend && pnpm run dev        # フロントエンド開発サーバー
cd proxy && deno task dev          # プロキシサーバー
```

### 品質チェック（タスク完了前に必須）
```bash
# フロントエンド
cd frontend
pnpm run type-check               # TypeScript型チェック
pnpm run lint                     # ESLintチェック
pnpm run test                     # テスト実行

# プロキシ・Cron
cd proxy && deno task check && deno task lint
cd cron && deno task check && deno task lint
```

## セットアップ・初期化

### 依存関係のインストール
```bash
cd frontend && pnpm install       # フロントエンド依存関係
```

### 環境変数設定
```bash
cd frontend && cp .env.example .env
cd proxy && cp .env.example .env
cd cron && cp .env.example .env
```

## ビルド・デプロイ

### 本番ビルド
```bash
cd frontend && pnpm run build     # フロントエンドビルド
cd frontend && pnpm run preview   # ビルド結果プレビュー
```

### デプロイ
```bash
cd frontend && pnpm run deploy    # Vercelデプロイ
```

## デバッグ・調査

### Cronスクリプトのテスト実行
```bash
cd cron
deno run --allow-net --allow-env --allow-read --env main.ts
deno run --allow-net --allow-env --allow-read --env remove_milestone_tasks.ts
```

### ログの確認
```bash
# プロキシサーバーのログ
cd proxy && deno task dev

# フロントエンドのビルドログ
cd frontend && pnpm run build
```

## Git操作

### 基本的なGitワークフロー
```bash
git status                        # 変更状況確認
git add .                         # ステージング
git commit -m "feat: 新機能追加"   # コミット（日本語）
git push                          # プッシュ
```

### ブランチ操作
```bash
git checkout -b feature/新機能名   # 機能ブランチ作成
git checkout main                 # メインブランチに戻る
git merge feature/新機能名         # マージ
```

## トラブルシューティング

### よくある問題の解決
```bash
# ポート競合の確認
lsof -ti:5173                     # フロントエンドポート確認
lsof -ti:8000                     # プロキシポート確認

# Node.jsプロセスの確認
ps aux | grep node                # Node.jsプロセス一覧
ps aux | grep deno                # Denoプロセス一覧

# 依存関係の再インストール
cd frontend && rm -rf node_modules && pnpm install
```

### キャッシュクリア
```bash
cd frontend && rm -rf dist        # ビルドキャッシュクリア
cd frontend && rm -rf .vite       # Viteキャッシュクリア
```

## パフォーマンス・品質監視

### バンドルサイズ分析
```bash
cd frontend && pnpm run build     # ビルド後にサイズ確認
```

### 型チェック詳細
```bash
cd frontend && npx tsc --noEmit --listFiles  # 型チェック詳細情報
```

## システム情報確認

### バージョン確認
```bash
node --version                    # Node.jsバージョン
pnpm --version                    # pnpmバージョン
deno --version                    # Denoバージョン
```

### 利用可能なタスク確認
```bash
cd frontend && pnpm run           # 利用可能なnpmスクリプト
cd proxy && deno task             # 利用可能なDenoタスク
cd cron && deno task              # 利用可能なDenoタスク
```