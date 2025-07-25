# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリ内のコードを扱う際のガイドラインを提供します。

## ドキュメント方針

このドキュメントでは、実装の技術的詳細だけでなく、**なぜその設計選択をしたか**の背景も記録します。

**なぜ背景を記録するか**: コードそのものからは設計の背景や判断理由が読み取れないためです。コードは「何を」「どのように」実装しているかは示しますが、「なぜそうしたか」「他の選択肢を検討したか」「どんな制約があったか」は表現できません。

これにより：
- 将来の開発者が設計意図を理解できる
- 同様の問題に直面した際の判断材料となる
- 技術的負債や制約の背景を明確にする
- リファクタリングや機能追加時に既存の設計思想を尊重できる

## アーキテクチャ概要（Lit初心者向け）

### アーキテクチャの全体像

```
UI層:
  app-element
  ├── auth-button, theme-toggle
  ├── filtered-nested-tasks-panel
  ├── goal-milestone-panel
  ├── date-goal-panel
  └── task-daily-completion-panel

コントローラー層:
  AuthController
  FilteredTaskController
  GoalMilestoneController
  DateGoalController
  TaskDailyCompletionController

サービス層:
  OAuthService
  TodoistService (REST API v2)
  TodoistSyncService (Sync API v9)
  ThemeService

外部API:
  Todoist API / OAuth
```

### データフローの流れ

```
External APIs → Services → Controllers → Components → UI
     ↑                                      ↓
   OAuth        Theme Service          Event Handlers
```

### ディレクトリ構造と役割分担

詳細なアーキテクチャ説明については、[`docs/lit-architecture.md`](./docs/lit-architecture.md)を参照してください。

#### 基本的な階層構造

```
7. アプリケーション層: app-element.ts
6. 機能パネル層: 各種パネルコンポーネント
5. UIコンポーネント層: components/ui/, components/task/
4. コントローラー層: controllers/（状態管理とリアクティブ制御）
3. サービス層: services/（API通信とビジネスロジック）
2. ユーティリティ層: utils/task-utils.ts, services/theme-service.ts
1. 基盤層: types/, config/, styles/, utils/template-utils.ts
```

#### 責務の概要

- **Services層**: 外部システムとの通信とデータ変換
- **Controllers層**: アプリケーションの状態管理とビジネスルール実装
- **Components/UI層**: データの表示とユーザー操作の受付

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
  * `TaskDailyCompletionController`: @taskタスクの日別完了統計を管理
* **サービス**：

  * `TodoistService`: `@doist/todoist-api-typescript` をラップした主要API
  * `TodoistSyncService`: Todoist Sync APIを使用して完了済みタスクの履歴を取得
    - **背景**: `@doist/todoist-api-typescript`が完了済みタスクAPIをサポートしていないため独自実装
    - **技術選択**: 直接Sync APIを呼び出し、独自の型定義とバリデーションを実装
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
pnpm run dev           # 開発サーバーを起動（ポート5173）
pnpm run build         # 本番用ビルド
pnpm run type-check    # TypeScript型チェック
pnpm run lint          # ESLintによるコードチェック
pnpm run test          # Vitestでテストを実行
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

### 新機能：依存関係タスクの表示順制御

`@dep-*`タグを使用したタスクの依存関係管理機能を追加：
- **使用方法**: 依存関係のあるタスクに`@dep-[前提タスク名]`ラベルを付与
- **表示制御**: 階層式ソートにより依存タスクを自動的に下位に配置
- **ソート順**:
  1. 通常タスク（`@dep-*`なし）を優先度順（4→3→2→1）で上位表示
  2. ブロックされたタスク（`@dep-*`あり）を優先度順で下位表示
- **実装場所**: `task-utils.ts`の`sortTasksByPriority()`および`isBlockedTask()`関数
- **設計背景**:
  - **問題**: タスクの依存関係が視覚的に分からず、前提タスクが完了していないのに依存タスクに取り組んでしまう
  - **解決方針**: ラベルベースの依存関係管理と表示順制御
  - **制約対応**: Todoistのラベル名60文字制限により`dep-`は`dependency-`の短縮形を採用

### 新機能：@taskタスク完了統計グラフ

@taskラベルが付いたタスクの日別完了統計をグラフ表示する機能を追加：
- **使用方法**: 過去30日間（デフォルト）の@taskタスクの完了数をバーグラフで表示
- **統計情報**: 合計完了数、平均完了数/日、最大完了数を表示
- **実装アーキテクチャ**:
  - `TodoistSyncService`: Todoist Sync APIを使用して完了済みタスクの履歴を取得
  - `TaskDailyCompletionController`: 日別完了統計の状態管理とデータ処理
  - `task-daily-completion-panel`: インタラクティブなグラフ表示UI
- **技術的詳細**:
  - REST API v2では完了履歴を取得できないため、Sync API v9を直接使用
  - 日付範囲での完了タスクフィルタリングと@taskラベルによる絞り込み
  - SVGベースの折れ線グラフ実装（グリッドライン、データポイント、ツールチップ付き）
  - valibotによるAPIレスポンスの実行時型チェックとバリデーション
- **バリデーション設計の進化**:
  - **初期方針**: 柔軟なバリデーション（`v.looseObject`）でエラー時にデフォルト値を使用
  - **問題の発見**: APIからlabelsフィールドが提供されないことが判明
  - **最終設計**: 
    - 実際のAPI構造に合わせた厳密なスキーマ（`v.object`）
    - バリデーション失敗時はエラーを正しく投げる（デフォルト値による隠蔽を排除）
    - ラベル機能は独自のコンテンツ抽出で実装
  - **学習**: 現実逃避的なデフォルト値よりも、正確なスキーマと適切なエラーハンドリングが重要
- **Sync API実装の試行錯誤**:
  - **初期実装**: 汎用`/sync`エンドポイントを使用（完了タスク数: 0の問題発生）
  - **問題の発見**: 間違ったエンドポイントとリクエスト形式の使用
  - **最終解決**: 専用`/completed/get_all`エンドポイントをGETリクエストで使用
  - **学習**: API調査の重要性と、ドキュメントの不完全さへの対応
- **ラベル抽出の工夫**:
  - **問題**: Sync APIの完了済みタスクにラベル情報が含まれていない
  - **解決策**: タスクコンテンツから正規表現`/@(\w+)/g`で@taskのようなラベルを抽出
  - **実装**: `extractLabelsFromContent()`メソッドで自動ラベル抽出
  - **効果**: APIの制限を回避し、@taskタスクの正確な識別が可能

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

#### 設計原則
* 状態管理にはLitのReactive Controllerパターンを採用
* すべてのコンポーネントはkebab-case命名のカスタム要素
* UIコンポーネントは再利用のために `components/ui/` に配置

#### 主要パネルコンポーネント階層
```
app-element
├── auth-button
├── theme-toggle
├── goal-milestone-panel
├── date-goal-panel
├── task-daily-completion-panel
└── filtered-nested-tasks-panel
    ├── setting-button
    ├── setting-modal
    └── task-list
        └── task-item (複数)
            ├── task-checkbox
            ├── task-content
            ├── task-meta
            └── parent-task-display
```

#### コンポーネント責任分担
* **`app-element`**: 認証とパネル統合の統括（ルートコンテナ）
* **`filtered-nested-tasks-panel`**: タスク一覧の表示と操作
* **`goal-milestone-panel`**: @goalタスクの@non-milestoneタグ割合統計
* **`date-goal-panel`**: 日付付き@goalタスクの期限監視と残り日数表示
* **`task-daily-completion-panel`**: @taskタスクの日別完了統計をグラフ表示
* **`task-list`**: タスクのソートと一覧表示
* **`task-item`**: 個別タスクの詳細表示と操作

#### コンポーネント設計原則
* **独立性**: 各パネルが独自のコントローラーを持ち、独立して動作
* **責任分離**: ビジネスロジック（Controller）とUI（Component）の分離
* **再利用性**: UIコンポーネントの汎用性を高める設計
* **合成パターン**: 小さなコンポーネントの組み合わせによる柔軟性
* **型安全性**: TypeScriptによる厳密な型チェック

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

* フロントエンドには Node.js 22+ および pnpm が必要
* プロキシサーバーには Deno が必要
* OAuth構成には環境変数の設定が必要
