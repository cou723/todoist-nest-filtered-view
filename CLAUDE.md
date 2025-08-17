# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリ内のコードを扱う際のガイドラインを提供します。

## ドキュメント方針

このドキュメントでは、実装の技術的詳細だけでなく、**なぜその設計選択をしたか**の背景も記録します。

**なぜ背景を記録するか**: コードそのものからは設計の背景や判断理由が読み取れないためです。コードは「何を」「どのように」実装しているかは示しますが、「なぜそうしたか」「他の選択肢を検討したか」「どんな制約があったか」は表現できません。

これにより将来の開発での設計意図理解と一貫性の維持が可能となります。

## 用語定義

このプロジェクトでは以下の用語を使用します：

- **Todo**: Todoistに登録される作業項目の総称
- **TaskTodo**: `@task`ラベルが付いたTodo（実際の作業単位）
- **GoalTodo**: `@goal`ラベルが付いたTodo（目標や大きな単位の作業）

これらの用語はコードベース全体で統一して使用されます。

## アーキテクチャ概要（Lit初心者向け）

### アーキテクチャ概要

#### 全体構造
- **UI層**: app-element をルートとしたコンポーネントツリー
- **コントローラー層**: 状態管理とリアクティブ制御
- **サービス層**: API通信とデータ処理

#### データフロー
外部API → Services → Controllers → Components → UI

#### 詳細アーキテクチャ
[`docs/lit-architecture.md`](./docs/lit-architecture.md)を参照してください。

## プロジェクト構成

これはフロントエンドとプロキシサーバーで構成されたTodoistタスク管理アプリケーションです：

### フロントエンド（`frontend/`）

* **技術スタック**：Lit（Web Components）、TypeScript、Vite
* **アーキテクチャ**：LitのReactiveControllerを使用したコントローラーベースのリアクティブパターン
* **主要コントローラー**：

  * `AuthController`: OAuth認証状態とトークンの管理を行う
  * `FilteredTaskController`: フィルタリングされたTodoの取得、キャッシュ、操作処理
  * `FilterController`: Todoのフィルタリングとクエリ状態管理
  * `GoalMilestoneController`: GoalTodoのマイルストーン統計を管理
  * `DateGoalController`: 日付付きGoalTodoの期限監視と残り日数表示を管理
  * `TaskDailyCompletionController`: TaskTodoの日別完了統計を管理
* **サービス**：

  * `TodoistService`: Todoist REST APIのラッパー
  * `TodoistSyncService`: 完了済みTodo履歴取得（独自実装）
  * `OAuthService`: OAuthフローの処理
  * `ThemeService`: テーマ管理

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

* `./dev.sh` でフロントエンドとプロキシを同時起動
* 開発サーバー: localhost:5173
* プロキシサーバー: localhost:8000

## 主要な実装の詳細

### Todoデータ構造

Todoは、親Todo情報を含む再帰的な `TodoNode` 型で拡張されており、ネストされたTodoの表示に対応。

### 主要機能

#### ゴールマイルストーン統計
GoalTodoのマイルストーン達成率を可視化する統計機能。

#### 日付付きゴール監視
期限が設定されたGoalTodoの残り日数監視機能。色分けによる視覚的な期限管理。

#### Todo完了統計
TaskTodoの日別完了統計をグラフ表示する機能。
- 過去30日間の完了数をバーグラフで表示
- 合計/平均/最大完了数の統計情報表示
- Sync APIを使用した完了履歴取得
- SVGベースのインタラクティブグラフ

### 認証フロー

1. フロントエンドがOAuthフローを開始
2. プロキシサーバーでセキュアなトークン交換
3. トークンのローカル保存と`AuthController`による管理

### Todoキャッシュ

`TodoistService` にはインテリジェントなキャッシュ機能を実装：

* APIレスポンスの5分間キャッシュ
* 階層構造の再帰的構築
* 操作時の自動キャッシュクリア

### コンポーネントアーキテクチャ

#### 設計原則
* 状態管理にはLitのReactive Controllerパターンを採用
* すべてのコンポーネントはkebab-case命名のカスタム要素
* UIコンポーネントは再利用のために `components/ui/` に配置

#### 主要コンポーネント構成
- **app-element**: アプリケーションルート
- **認証・設定系**: auth-button, theme-toggle
- **機能パネル系**: 各種統計・一覧表示パネル
- **Todo表示系**: task-list, task-item とその構成要素

#### コンポーネント責任分担
* **app-element**: アプリケーション全体の統括管理
* **パネルコンポーネント**: 各機能の独立表示ユニット
* **UIコンポーネント**: 再利用可能な表示要素
* **Todoコンポーネント**: Todoアイテムの表示と操作

#### 設計原則
* **コンポーネントの独立性と再利用性**
* **ビジネスロジックとUIの分離**
* **TypeScriptによる型安全性**

## アーキテクチャの変更履歴

### v2.0 - コンポーネント分離・リファクタリング（最新）

* **コントローラー名称変更**: `TaskController` → `FilteredTaskController`（役割明確化）
* **パネル化**: 機能別の独立コンポーネントに分離
* **app-element簡素化**: 認証とパネル統合に責任を限定
* **統一アーキテクチャ**: 各パネルが独自のコントローラーを持つ設計

### パフォーマンス・制限事項

* **想定規模**: 中規模のTodo数（〜500件程度）を前提とした設計
* **パフォーマンス**: 大量Todo（1000件超）では初回ロード時間に影響する可能性
* **対応案**: 仮想化やページング実装の検討

### 動作環境要件

* フロントエンドには Node.js 22+ および pnpm が必要
* プロキシサーバーには Deno が必要
* OAuth構成には環境変数の設定が必要
