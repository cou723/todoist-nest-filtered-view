# Frontend - Todoist Nest Filtered View

Vite + React 19 + TypeScript で構築された SPA です。

## 技術スタック

### コアフレームワーク
- **React 19** - UI フレームワーク
- **TypeScript** - 型安全性
- **Vite 7** - ビルドツール

### 主要ライブラリ
- **Effect エコシステム** (`effect`, `effect/Schema`, `@effect/platform`, `@effect/rpc`) - ドメインロジックと API 呼び出しの型安全な管理
- **Mantine** (`@mantine/core`, `@mantine/notifications`) - UI コンポーネントライブラリ
- **@nivo/line** - 完了統計のラインチャート描画
- **date-fns** - 日付処理
- **React Router v6** - ルーティング
- **Todoist TypeScript SDK** - Todoist API へのアクセス

### 開発ツール
- **Vitest** - テストフレームワーク
- **@testing-library/react** - React コンポーネントのテスト
- **biome** - Lint・フォーマット
- **pnpm** - パッケージマネージャ

## プロジェクト構成

```
./
├── src/
│   ├── app/            # エントリーポイントとルーター、プロバイダ
│   ├── features/       # 機能別モジュール（認証、タスク/統計 UI など）
│   ├── shared/         # 共通ユーティリティとコンポーネント
│   ├── main.tsx        # エントリーポイント
│   └── index.css       # グローバルスタイル
├── public/             # 静的ファイル
├── package.json
├── vite.config.ts      # Vite 設定
├── vitest.config.ts    # Vitest 設定
├── biome.json          # biome 設定
└── tsconfig.json       # TypeScript 設定
```

### ディレクトリの役割

- **`src/app/`**: アプリ全体の設定とルートコンポーネント（OAuth 注入、テーマ、ルーティング）
- **`src/features/`**: 認証・環境変数・タスク/統計 UI など機能単位のモジュール
- **`src/shared/`**: 汎用的な UI コンポーネントやユーティリティ

## セットアップ

### 前提条件
- Node.js 18 以上
- pnpm (推奨)

### 環境変数

`.env.sample` をコピーして `.env` を作成し、少なくとも以下を設定してください。

- `VITE_TODOIST_CLIENT_ID`: Todoist Developer Console の Client ID
- `VITE_TODOIST_REDIRECT_URI`: 例 `http://localhost:5173/callback`
- `VITE_PROXY_URL`: OAuth API を中継するプロキシの URL（開発は `http://localhost:8000`）
- `VITE_USE_MOCK_CLIENT`: モック利用時のみ `true`

### インストール

```bash
# 依存関係のインストール
pnpm install
```

## 開発

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

### ビルド

```bash
pnpm build
```

ビルド成果物は `dist/` ディレクトリに生成されます。

### プレビュー

```bash
pnpm preview
```

ビルドした成果物をローカルでプレビューできます。

## コード品質

### Lint

```bash
pnpm lint
```

biome を使用してコードの品質チェックを行います。

### フォーマット

```bash
pnpm format
```

biome を使用してコードを自動フォーマットします。

### テスト

```bash
# テストの実行
pnpm test

# UI 付きでテストを実行
pnpm test:ui
```

### 自動修正CI

- `Frontend CI` でフォーマット/リントが失敗した場合、`Frontend Auto Fix` が元ブランチを起点に `pnpm format` と `pnpm lint -- --fix` を適用した `auto/frontend-fix/<元ブランチ名>` ブランチのPRを自動作成します（リント以外の失敗やフォークからのPRは対象外）。

## プロキシ (Deno Deploy / ローカル)

- リポジトリルート配下の `proxy/main.ts` を Deno で動かす。
- 必須環境変数: `TODOIST_CLIENT_SECRET`、`ALLOWED_ORIGIN`（例 `http://localhost:5173`）。
- ローカル起動例:

```bash
cd ../proxy
ALLOWED_ORIGIN=http://localhost:5173 \
TODOIST_CLIENT_SECRET=xxx \
deno run --allow-net --allow-env main.ts
```

本番デプロイ時は Deno Deploy の環境変数を本番ドメインに合わせて更新すること。

## 現在の主な機能

- Todoist OAuth 認証（リダイレクト処理、ログアウト、テーマトグル付き AppShell）
- CompletionStatsPanel: 過去 90 日 + 当日の完了件数と 7 日移動平均を @nivo/line で可視化、除外ラベル設定（localStorage 既存値を適用）
- GoalRatePanel: @goal タスクに対する @non-milestone 割合の表示
- DatedGoalsPanel: 期限付き @goal タスクを期日順に一覧表示（Todoist へのリンク付き）
- TaskListPanel: フィルタ設定の読み出し、タスクツリー表示、完了操作と手動リフレッシュ

## ライセンス

MIT License
