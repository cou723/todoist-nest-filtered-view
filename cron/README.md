# Todoist Automation Service

TodoistTodoの自動タグ管理サービス

## 機能

1時間おきに以下の自動処理を実行：

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

## Deno Deployでの使用

環境変数 `TODOIST_TOKEN` を設定してデプロイ。

## 処理フロー

1. **効率的なAPI呼び出し**: 必要なタスクのみをフィルタリングして取得
   - `@goal`タスク、`@task`タスク、`@non-milestone`タスクを個別に取得
   - 公式TodoistApiクライアントを使用
2. 各自動処理を順次実行
3. 変更内容をコンソールに出力
4. 1時間後に再実行

## API効率化

- 全件取得ではなく、ラベルフィルタを使用した必要なタスクのみの取得
- 公式`@doist/todoist-api-typescript`クライアントを使用
- ページング処理にも対応
