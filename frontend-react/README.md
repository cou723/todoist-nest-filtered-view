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

## 環境変数の設定

`.env.example` を `.env` にコピーして、必要な値を設定してください：

```bash
cp .env.example .env
```

`.env` ファイルの内容:

```env
# Todoist OAuth Client ID (必須)
VITE_TODOIST_CLIENT_ID=your_todoist_client_id_here

# OAuth Redirect URI (通常はアプリのベースURL)
VITE_REDIRECT_URI=http://localhost:5173

# OAuth Proxy URL (OAuthプロキシサーバーのURL)
VITE_PROXY_URL=http://localhost:8000
```

## OAuth プロキシの起動

認証機能を使用するには、別ターミナルでOAuthプロキシを起動する必要があります：

```bash
cd ../proxy
deno run --allow-net --allow-env main.ts
```

## 認証フロー（Phase 4 実装完了）

このアプリケーションは Todoist OAuth 2.0 を使用した認証を実装しています。

### 認証の流れ

1. **未認証時**: 「Todoistでログイン」ボタンが表示されます
2. **ログインボタンクリック**: 
   - CSRF保護のための `state` が生成され、localStorage と sessionStorage に保存されます
   - Todoist OAuth 認可画面にリダイレクトされます
3. **Todoist 認可**: ユーザーがアクセスを許可すると、アプリにリダイレクトされます
4. **コールバック処理**:
   - URLから `code` と `state` を取得
   - `state` を検証（CSRF保護）
   - OAuth プロキシ経由でトークンを取得
   - `todoist_token` を localStorage に保存
5. **認証済み**: すべてのパネル（ゴール率、日付付きゴール、完了統計、タスク一覧）が表示されます

### ログアウト

ヘッダーのログアウトボタンをクリックすると：
- localStorage からトークンと state が削除されます
- 認証状態がリセットされます
- ログイン画面に戻ります

## 実装完了フェーズ

✅ **Phase 1: プロジェクトセットアップ**
- Vite + React 19 + TypeScript の SPA プロジェクト作成
- 必要な依存関係をすべて導入
- ディレクトリ構成の確立
- 基本的なアプリシェルの実装
- テスト環境の整備

✅ **Phase 4: 認証フロー実装**
- AuthService による OAuth ロジック
- AuthContext/AuthProvider による認証状態管理
- ログインパネル（LoginButton, LoginPanel）
- OAuthコールバック処理（OAuthCallback）
- ログアウト機能（LogoutButton）
- エラーハンドリングと表示
- 環境変数設定（.env.example）

## 次のステップ

Phase 2, 3, 5 以降では、以下の機能を段階的に実装していきます:
- Todoist API との連携
- タスク一覧表示
- ゴール管理機能
- 統計グラフの可視化
- フィルタリング機能

## ライセンス

MIT License
