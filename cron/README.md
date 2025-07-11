# Todoist Automation Service

Todoistタスクの自動タグ管理サービス

## 機能

1時間おきに以下の自動処理を実行：

### 1. @goalタスクの自動処理

- `@goal`ラベルがあり、`@non-milestone`ラベルがなく、**`@task`または`@goal`の子タスクがない**タスクを検出
- 該当タスクに`@non-milestone`ラベルを追加
- 「${タスク名}のマイルストーンを置く」という子タスクを作成（ラベルなし）

**注意**: 子タスクに`@goal`ラベルがある場合、そのタスクは`@non-milestone`として扱われません

### 2. @non-milestoneタスクの自動処理

- `@non-milestone`ラベルを持つタスクで、`@task`ラベルを持つ子タスクがあるものを検出
- 該当タスクから`@non-milestone`ラベルを削除

### 3. @blocked-by-ラベルの管理（gcプロジェクト限定）

- **gcプロジェクトの`@goal`ラベル付きタスクに対応する`@blocked-by-*`ラベルを自動生成**
- ラベル形式:
  - 親タスクがある場合: `blocked-by-親タスク名-タスク名`
  - 親タスクがない場合: `blocked-by-タスク名`
- gcプロジェクトに存在しない`@goal`タスクに対応する`@blocked-by-*`ラベルをアカウントから削除
- 新しく作成されたラベルは赤色で追加

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
