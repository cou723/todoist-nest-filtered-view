# Todoist Automation Service

TodoistTodoの自動タグ管理サービス

## 機能

5分おきに以下の自動処理を実行：

### 1. GoalTodoの自動処理

- `@goal`ラベルがあり、`@non-milestone`ラベルがなく、**`@task`または`@goal`の子Todoがない**Todoを検出
- 該当Todoに`@non-milestone`ラベルを追加
- 「${Todo名}のマイルストーンを置く」という子Todoを作成（ラベルなし）

**注意**: 子Todoに`@goal`ラベルがある場合、そのTodoは`@non-milestone`として扱われません

### 2. @non-milestoneTodoの自動処理

- `@non-milestone`ラベルを持つTodoで、`@task`ラベルを持つ子Todoがあるものを検出
- 該当Todoから`@non-milestone`ラベルを削除


## セットアップ

1. 環境変数の設定:

```bash
cp .env.example .env
# .envファイルにTODOIST_TOKENを設定
```

2. 実行:

```bash
deno task dev    # 開発モード
deno task start  # 本番モード
```

## 開発コマンド

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


## Deno Deployでの使用

環境変数 `TODOIST_TOKEN` を設定してデプロイ。

## 処理フロー

1. **効率的なAPI呼び出し**: 必要なタスクのみをフィルタリングして取得
   - `@goal`タスク、`@task`タスク、`@non-milestone`タスクを個別に取得
   - 公式TodoistApiクライアントを使用
2. 各自動処理を順次実行
3. 変更内容をコンソールに出力
4. 5分後に再実行

## API効率化

- 全件取得ではなく、ラベルフィルタを使用した必要なタスクのみの取得
- 公式`@doist/todoist-api-typescript`クライアントを使用
- ページング処理にも対応

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