# Todoist Automation Service

Todoistタスクの自動タグ管理サービス

## 機能

1時間おきに以下の自動処理を実行：

### 1. @goalタスクの自動処理
- `@goal`ラベルがあり、`@non-milestone`ラベルがなく、`@task`の子タスクがないタスクを検出
- 該当タスクに`@non-milestone`ラベルを追加
- 「${タスク名}のマイルストーンを置く」という子タスクを作成（ラベルなし）

### 2. @non-milestoneタスクの自動処理
- `@non-milestone`ラベルを持つタスクで、`@task`ラベルを持つ子タスクがあるものを検出
- 該当タスクから`@non-milestone`ラベルを削除

### 3. @blocked-by-ラベルの管理
- 全タスクから`@blocked-by-*`ラベルを抽出し、アカウントのラベル一覧に追加
- 対応するタスクが存在しない`@blocked-by-*`ラベルをアカウントから削除

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

1. Todoist APIから全タスクとラベルを取得
2. 各自動処理を順次実行
3. 変更内容をコンソールに出力
4. 1時間後に再実行