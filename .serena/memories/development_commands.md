# 開発用コマンド

## フロントエンド (frontend/)

### 基本コマンド
```bash
cd frontend
pnpm install           # 依存関係のインストール
pnpm run dev           # 開発サーバーを起動（ポート5173）
pnpm run build         # 本番用ビルド
pnpm run preview       # ビルド結果のプレビュー
```

### 品質管理コマンド
```bash
pnpm run type-check    # TypeScript型チェック
pnpm run lint          # ESLintによるコードチェック
pnpm run test          # Vitestでテストを実行
```

### デプロイコマンド
```bash
pnpm run deploy        # Vercelにデプロイ
```

## プロキシサーバー (proxy/)

```bash
cd proxy
deno task dev          # ウォッチモードで開発サーバー起動（ポート8000）
deno task start        # 本番用サーバー起動
deno task fmt          # コードの整形
deno task lint         # コードのリント
deno task check        # 型チェック
```

## Cronサービス (cron/)

```bash
cd cron
deno task dev          # ウォッチモードで開発
deno task start        # 本番モード
deno task fmt          # コードの整形
deno task lint         # コードのリント
deno task check        # 型チェック

# 特定のスクリプトを実行
deno run --allow-net --allow-env --allow-read --env remove_milestone_tasks.ts
```

## 統合開発コマンド

### 並行起動
```bash
# ルートディレクトリから
./dev.sh               # フロントエンドとプロキシを同時起動
```

### 個別起動
```bash
# ターミナル1: プロキシサーバー起動
cd proxy && ./start.sh

# ターミナル2: フロントエンド起動
cd frontend && pnpm install && pnpm run dev
```

## 環境設定

### 環境変数ファイルの設定
```bash
# フロントエンド
cd frontend && cp .env.example .env

# プロキシサーバー
cd proxy && cp .env.example .env

# Cronサービス
cd cron && cp .env.example .env
```

## システムコマンド（Linux）

- `git` - Gitによるバージョン管理
- `ls` - ディレクトリ一覧表示
- `cd` - ディレクトリ移動
- `grep` - テキスト検索
- `find` - ファイル検索