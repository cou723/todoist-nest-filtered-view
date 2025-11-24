# フロントエンド技術選定メモ

本プロジェクトの新フロントエンド実装（ディレクトリ: `frontend-react/`）で採用する主要な技術要素をまとめる。現行運用中の Lit 版は `frontend-lit-legacy/` を参照。

- アプリケーションフレームワーク: React 19 + TypeScript + Vite 7（SPA 構成、静的ホスティング前提）
- ルーティング: `react-router-dom` でページ遷移と認可保護を実装
- 状態管理・非同期: Effect エコシステム（`effect`, `@effect/schema`, `@effect/platform`）でドメインロジックと API 呼び出しを集約
- データ取得・キャッシュ: TanStack Query `@tanstack/react-query`）でローディング／エラーとキャッシュを管理
- UI コンポーネント: Mantine を採用し、レイアウト・モーダル・フォーム・テーマ切り替えなどをライブラリベースで構築（アイコンは `@tabler/icons-react`）
- グラフ描画: Recharts により完了件数推移と 7 日移動平均の折れ線グラフを実装
- 日付処理: `date-fns` を用いて「今日／明日／N 日前・後」や集計日付の計算を行う
- テスト: Vitest + jsdom 環境を基本とし、`@testing-library/react` と `@testing-library/jest-dom` で DOM 検証を行う
- 開発ツール: パッケージマネージャに `pnpm`、Lint／フォーマットに biome を利用する

基本方針として、UI・レイアウト・グラフ・フォームなどは既存ライブラリを優先して用い、自前実装を最小限にとどめる一方で、Todoist 特有のドメインロジックや集計処理は Effect を中心とした型安全なサービスとして実装する。
