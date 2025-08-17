# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Todoist自動化Cronサービス

このディレクトリには、TodoistTodoの自動タグ管理を行うDenoベースのCronサービスが含まれています。

### 開発コマンド

```bash
# 開発モード（ウォッチモード）
deno task dev

# 本番モード
deno task start

# コードの整形
deno task fmt

# コードのリント
deno task lint

# 型チェック
deno task check

# 特定のスクリプトを実行
deno run --allow-net --allow-env --allow-read --env remove_milestone_tasks.ts
```

## 用語の統一ルール

このプロジェクトでは以下の用語統一ルールを適用します：

### 基本用語

- **Todo**: TodoistのTodo全般を指す基本単位
- **Goal**: `@goal`ラベルが付いたTodoを指す
- **Task**: `@task`ラベルが付いたTodoを指す

### 命名規則

- **変数名・関数名**: 上記の用語を使用（例: `goalTodos`, `taskTodos`, `findGoalTodos`）
- **コメント・ログ**: 文脈に応じて適切な用語を使用
- **TypeScript型**: Todoist APIの型定義に合わせて`Task`を使用（`Task`型）

### 具体例

```typescript
// ✓ 正しい命名
const goalTodos = todos.filter((todo) => todo.labels.includes("goal"));
const taskTodos = todos.filter((todo) => todo.labels.includes("task"));

// ✗ 避けるべき命名
const goalTasks = todos.filter((todo) => todo.labels.includes("goal"));
const taskTasks = todos.filter((todo) => todo.labels.includes("task"));
```

### アーキテクチャ概要

```
main.ts (メインの自動化処理)
├── TodoService (task-service.ts)
│   ├── 5分間のインメモリキャッシュ
│   ├── ラベルフィルタによる効率的なAPI呼び出し
│   └── @doist/todoist-api-typescript クライアント
└── 自動化処理
    ├── processGoalTasks() - GoalTodoの@non-milestone自動付与
    └── cleanupNonMilestoneTodos() - @non-milestoneTodoの自動剥奪

remove_milestone_tasks.ts (ユーティリティスクリプト)
└── TodoService を使用したマイルストーンTodoの一括削除
```

### 自動化処理の詳細

#### 1. GoalTodoの自動処理 (`processGoalTasks`)

- **対象**: `@goal`ラベルがあり、`@non-milestone`ラベルがなく、`@task`または`@goal`の子TodoがないTodo
- **処理**:
  - 該当Todoに`@non-milestone`ラベルを追加
  - 「${Todo名}のマイルストーンを置く」という子Todoを作成（ラベルなし）

#### 2. @non-milestoneTodoの自動処理 (`cleanupNonMilestoneTodos`)

- **対象**: `@non-milestone`ラベルを持つTodoで、`@task`または`@goal`ラベルを持つ子Todoがあるもの
- **処理**: 該当Todoから`@non-milestone`ラベルを削除


### TodoServiceの設計

**キャッシュ戦略**:

- 5分間のインメモリキャッシュでAPI呼び出しを最適化
- ラベル別キャッシュ（`@goal`, `@task`, `@non-milestone`）
- タスク変更時の自動キャッシュクリア

**主要メソッド**:

- `analyzeTasksForAutomation()` - 自動化処理対象のTodoを分析 (戻り値: `TodoAnalysis`)
- `getAllRequiredTodos()` - 必要なラベルのTodoを一括取得
- `findLeafGoalTodos()` - 子Todoを持たないGoalTodoを検索
- `findNonMilestoneParentTodos()` - @task/@goalの子Todoを持つ@non-milestoneTodoを検索
- `updateTask()` - Todoのラベル更新
- `addTodo()` - 新規Todoの作成
- `deleteTask()` - Todoの削除
- `getAllTasks()` - 全てのTodoを取得
- `findMilestoneTasks()` - マイルストーンTodoを特定

**型定義**:

- `TodoFilters` - Todoフィルタの設定
- `TodoAnalysis` - Todo分析結果 (`leafGoalTodos`, `nonMilestoneParentTodos`)

### 設計の背景

**API効率化**:

- 全件取得ではなく、ラベルフィルタを使用した必要のTodoのみの取得
- 公式`@doist/todoist-api-typescript`クライアントを使用
- 短時間での重複API呼び出しを避けるキャッシュ戦略

**ログ出力**:

- 必要最小限の情報のみ出力
- 処理開始/終了とサマリー情報
- 詳細なタスク単位のログは削除済み

**型安全性**:

- TypeScriptによる厳密な型チェック
- インターフェースによる明確な契約定義
- 実行時エラーの最小化

### 環境設定

```bash
# 環境変数
TODOIST_TOKEN=your_todoist_token_here
```

### デプロイ

Deno Deployでの実行を想定。環境変数`TODOIST_TOKEN`を設定してデプロイ。
