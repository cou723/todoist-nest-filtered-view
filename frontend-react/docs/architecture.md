# frontend-react アーキテクチャノート

このドキュメントは、`src/_olds` 以前の実装を破棄して組み直した現行 `src/` の設計思想をまとめたものです。React + Effect を中心に、UI・ユースケース・インフラの依存方向を明示します。

## ディレクトリとレイヤ
- `src/app/` : ルートエントリ。Router、プロバイダ、DI の結線（例: `OAuthServiceLive` を `AuthProvider` に注入）。
- `src/features/<feature>/` : 機能単位で完結させる。
  - `_domain` : ドメインモデルとユースケース型。副作用なし。React/ブラウザ API への依存禁止。
  - `__application` : ユースケース実装とポート（例: `OAuthService`, `TaskRepository`）。Effect で副作用を表現し、UI/インフラに依存しない。
  - `___infrastructure` : 外部 API/ブラウザ依存の実装（例: `OAuthServiceLive`, RPC クライアント, Todoist API 実装）。ポートを満たす形で提供し、UI から注入されることを前提にする。
  - `___ui` : React コンポーネントとフック。アプリケーション層のポートを受け取り、UI 状態を管理する。Mantine 等の UI ライブラリへの依存はここに閉じ込める。
- `src/_olds/` : 旧実装の残骸。参照のみで、新規コードからは依存しない。

依存方向は上位→下位のみ（UI→アプリケーション→ドメイン / インフラ）。ドメインは何にも依存しない。

## 認証フロー（Todoist OAuth）
- ポート `OAuthService`（アプリケーション層）を `OAuthServiceLive`（インフラ層）が実装。Effect を使い、状態管理は `localStorage`/`sessionStorage` に閉じる。
- 認可 URL 生成〜state 永続化は `startOAuth` ユースケース。ブラウザ遷移は呼び出し側（UI）に委譲。
- コールバック処理は `handleOAuthCallback` がパラメータを検証し、`OAuthService.getToken` がプロキシ RPC を経由してアクセストークンを交換。state は検証後に必ず破棄する。
- トークン破棄は `logout` ユースケース。RPC で失敗してもローカルの state/token は必ず削除。
- UI は `AuthProvider` がコンテキストを提供し、`AuthGate` で未認証時は `LoginForm` に切り替える。`OAuthCallback` はコールバック URL を処理し、成功時に `/` へリダイレクト。

## Todoist データ取得
- ポート `TaskRepository` を `TaskRepositoryImpl` が実装。`TodoistApi` を内部で扱い、ページネーションを吸収して `Task` ドメインモデルに正規化する。
- 期限などの日付は `Date` に変換して保持する。タイムゾーン依存のロジックは `date-fns` 等を使って UI 層で処理する方針。
- UI パネル（タスク一覧・統計・ゴール率など）はまだプレースホルダー。実装時はアプリケーション層のユースケースを追加し、UI からポートを注入する。

## 環境変数の扱い
- `features/env` で `@effect/schema` を用いて起動時に検証し、必須値 (`VITE_TODOIST_CLIENT_ID`, `VITE_TODOIST_REDIRECT_URI`, `VITE_PROXY_URL`, `VITE_USE_MOCK_CLIENT`) の欠落や空文字をフェイルファストする。
- `getEnvImpl` はインフラ層でのみ使用し、UI 直下やユースケースに生の `import.meta.env` を触らせない。

## UI シェルとテーマ
- Mantine の `AppShell` を採用し、ヘッダにテーマトグルとログアウトを配置。`ThemeToggle` は Mantine の `useMantineColorScheme` に委譲。
- 各パネルは `PanelWrapper` で統一したスタイルを持たせる。大きな状態管理はコンテキスト（例: `AuthContext`）で集約し、個別パネルは props で必要最小限を受け取る。

## 今後の実装指針
- 新規機能はまずポート（アプリケーション層）を定義し、UI から注入する形で書く。ブラウザ API や外部サービスへの直接依存を UI/インフラに閉じ込める。
- 副作用は Effect で表現し、例外はドメインに漏らさない。型で表現できない場合はエラーをドキュメント化する。
- 旧コードの流用は `_olds` の参照のみ。移行時は現行レイヤ構成に合わせて再組立てする。
