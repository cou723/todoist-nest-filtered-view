# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリ内のコードを扱う際のガイドラインを提供します。

## プロジェクト構成

これは、2つの主要部分に分かれたフルスタックのTodoistタスクリストアプリケーションです：

### フロントエンド（`frontend/`）

* **技術スタック**：Lit（Web Components）、TypeScript、Vite
* **アーキテクチャ**：LitのReactiveControllerを使用したコントローラーベースのリアクティブパターン
* **主要コントローラー**：

  * `AuthController`: OAuth認証状態とトークンの管理を行う
  * `FilteredTaskController`: フィルタリングされたTodoistタスクの取得、キャッシュ、操作を処理
  * `FilterController`: タスクのフィルタリングとクエリ状態を管理
  * `GoalMilestoneController`: @goalタスクのマイルストーン統計を管理
  * `DateGoalController`: 日付付き@goalタスクの期限監視と残り日数表示を管理
* **サービス**：

  * `TodoistService`: `@doist/todoist-api-typescript` をラップした主要API
  * `OAuthService`: プロキシサーバーを用いたOAuthフローの処理
  * `ThemeService`: ダーク／ライトテーマの管理

### プロキシサーバー（`proxy/`）

* **技術スタック**：Deno、TypeScript
* **目的**：CORS対策およびクライアントシークレットの安全な取り扱いを行うOAuthプロキシ
* **エンドポイント**：

  * `/oauth/token`: 認可コードをアクセストークンに交換
  * `/oauth/revoke`: アクセストークンの失効
* **デプロイ先**：Deno Deploy

## 開発用コマンド

### フロントエンド

```bash
cd frontend
pnpm install           # 依存関係のインストール
pnpm dev               # 開発サーバーを起動（ポート5173）
pnpm build             # 本番用ビルド
pnpm type-check        # TypeScript型チェック
pnpm lint              # ESLintによるコードチェック
pnpm test              # Vitestでテストを実行
```

### プロキシサーバー

```bash
cd proxy
deno task dev          # ウォッチモードで開発サーバー起動（ポート8000）
deno task start        # 本番用サーバー起動
deno task fmt          # コードの整形
deno task lint         # コードのリント
deno task check        # 型チェック
```

### 開発ワークフロー

* ルートディレクトリの `./dev.sh` を使用して、フロントエンドとプロキシを同時起動可能
* フロントエンドは [http://localhost:5173](http://localhost:5173) で稼働
* プロキシは [http://localhost:8000](http://localhost:8000) で稼働

## 主要な実装の詳細

### タスクデータ構造

タスクは、親タスク情報を含む再帰的な `TaskNode` 型で拡張されており、ネストされたタスクの表示に対応。

### 新機能：ゴールマイルストーン統計

@goalタスクのうち@non-milestoneタグが付いているタスクの割合を統計表示する機能を追加：
- `GoalMilestoneController`が@goalタスクを取得・分析
- リアルタイムで割合を計算・表示
- 専用パネル`goal-milestone-panel`で常時表示

### 新機能：日付付きゴールタスク監視

期限が設定された@goalタスクの監視と残り日数表示機能を追加：
- `DateGoalController`が日付付きの@goalタスクを取得・監視
- 期限までの残り日数を色分けして表示（期限切れ：赤、今日：オレンジ、緊急：青、近日：緑、通常：グレー）
- 専用パネル`date-goal-panel`で常時表示
- ダークモード完全対応（統一されたテーマシステム使用）

### 認証フロー

1. フロントエンドがTodoistとのOAuthフローを開始
2. プロキシサーバーが保存済みクライアントシークレットを使用してトークンを交換
3. トークンは `localStorage` に保存され、`AuthController` により管理される

### タスクキャッシュ

`TodoistService` はインテリジェントなキャッシュ処理を実装：

* APIレスポンスは5分間キャッシュ
* 親タスク取得による階層構造を再帰的に構築
* タスク完了操作時にキャッシュをクリア

### コンポーネントアーキテクチャ

* 状態管理にはLitのReactive Controllerパターンを採用
* すべてのコンポーネントはkebab-case命名のカスタム要素
* UIコンポーネントは再利用のために `components/ui/` に配置
* **主要パネルコンポーネント**：
  * `app-element`: アプリケーションのメインコンテナ（認証とパネル統合のみ）
  * `filtered-nested-tasks-panel`: フィルタリングされたタスク一覧の表示と操作
  * `goal-milestone-panel`: @goalタスクの@non-milestoneタグ割合統計を表示
  * `date-goal-panel`: 日付付き@goalタスクの期限監視と残り日数表示
* **コンポーネント設計原則**：
  * 各パネルが独自のコントローラーを持ち、独立して動作
  * 責任の分離により保守性と再利用性を向上
  * 合成パターンによる柔軟な組み合わせ

## アーキテクチャの変更履歴

### v2.0 - コンポーネント分離・リファクタリング（最新）

* **TaskController** → **FilteredTaskController**にリネーム（役割を明確化）
* **パネルコンポーネント化**：
  * `filtered-nested-tasks-panel`: タスク一覧機能を独立コンポーネント化
  * `goal-milestone-panel`: ゴール統計専用パネルを追加
* **app-element簡素化**：認証とパネル統合のみに責任を限定
* **コントローラーパターン統一**：各パネルが独自のコントローラーを持つ設計

### パフォーマンス・制限事項

* **タスク数制限**: 本アプリケーションは中規模のタスク数（〜500件程度）を想定して設計
* **全ページ取得**: フィルタ機能では全ページのタスクを取得するため、大量のタスク（1000件超）では初回ロードが遅くなる可能性
* **推奨対応**: 大量タスクがある場合は、UI仮想化（Virtual Scrolling）やページング表示の実装を検討

### 動作環境要件

* フロントエンドには Node.js 18+ および pnpm が必要
* プロキシサーバーには Deno が必要
* OAuth構成には環境変数の設定が必要
