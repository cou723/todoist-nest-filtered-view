# Frontend - Todoist Nest Filtered View

Vite + React 19 + TypeScript で構築された SPA フロントエンドプロジェクトです。リポジトリ内では `frontend-react/` ディレクトリに配置され、現行運用中の Lit 版は `frontend-lit-legacy/` に残しています。

## 技術スタック

### コアフレームワーク
- **React 19** - UI フレームワーク
- **TypeScript** - 型安全性
- **Vite 7** - ビルドツール

### 主要ライブラリ
- **Effect エコシステム** (`effect`, `@effect/schema`, `@effect/platform`) - ドメインロジックと API 呼び出しの型安全な管理
- **@tanstack/react-query** - データ取得・キャッシュ管理
- **Mantine** - UI コンポーネントライブラリ
- **Recharts** - グラフ描画
- **date-fns** - 日付処理

### 開発ツール
- **Vitest** - テストフレームワーク
- **@testing-library/react** - React コンポーネントのテスト
- **biome** - Lint・フォーマット
- **pnpm** - パッケージマネージャ

## プロジェクト構成

```
frontend-react/
├── src/
│   ├── app/            # アプリケーションのエントリーポイントとルート設定
│   ├── features/       # 機能別のモジュール（ドメインロジック、コンポーネント）
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

- **`src/app/`**: アプリケーション全体の設定とルートコンポーネント
- **`src/features/`**: 機能単位のモジュール（今後実装予定）
  - Todoist タスク一覧
  - ゴール管理
  - 統計グラフ
  - など
- **`src/shared/`**: 複数の機能で共有される汎用的なコード
  - UI コンポーネント
  - ユーティリティ関数
  - 型定義
  - など

## セットアップ

### 前提条件
- Node.js 18 以上
- pnpm (推奨)

### 環境変数

`.env.sample` をコピーして `.env` を作成し、少なくとも以下を設定してください。

- `VITE_TODOIST_CLIENT_ID`: Todoist Developer Console の Client ID
- `VITE_TODOIST_REDIRECT_URI`: 例 `http://localhost:5173/callback`
- `VITE_PROXY_URL`: OAuth/Completed API を中継するプロキシの URL（開発は `http://localhost:8000`）
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

## プロキシ (Deno Deploy / ローカル)

- ルート直下の `proxy/main.ts` を Deno で動かす。
- 必須環境変数: `TODOIST_CLIENT_SECRET`、`ALLOWED_ORIGIN`（例 `http://localhost:5173`）。
- ローカル起動例:

```bash
cd ../proxy
ALLOWED_ORIGIN=http://localhost:5173 \
TODOIST_CLIENT_SECRET=xxx \
deno run --allow-net --allow-env main.ts
```

本番デプロイ時は Deno Deploy の環境変数を本番ドメインに合わせて更新すること。

## Phase 1 完了内容

✅ プロジェクトセットアップ完了:
- Vite + React 19 + TypeScript の SPA プロジェクト作成
- 必要な依存関係をすべて導入
  - Effect エコシステム
  - @tanstack/react-query
  - Mantine UI
  - Recharts
  - date-fns
  - Vitest
  - biome
- ディレクトリ構成の確立 (`app/`, `features/`, `shared/`)
- 基本的なアプリシェルの実装
- テスト環境の整備
- Lint/フォーマットの設定

## 次のステップ

Phase 2 以降では、以下の機能を段階的に実装していきます:
- Todoist API との連携
- OAuth 認証フロー
- タスク一覧表示
- ゴール管理機能
- 統計グラフの可視化
- フィルタリング機能

## ライセンス

MIT License
