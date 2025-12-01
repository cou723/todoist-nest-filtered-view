# 依存関係ラベル仕様書

## 概要

goalTodoに基づいて、依存関係を示すdep-ラベルを自動生成・管理するシステムの仕様を定義する。

## ラベル名生成ルール

### 基本形式

```
dep-<変換されたTodo名>
```

### 空白の変換ルール

Todo名に含まれる空白（スペース）は、`_`（アンダーバー）に変換する。

**例:**
- `Write Letter` → `Write_Letter`
- `Buy Birthday Card` → `Buy_Birthday_Card`

### 親子関係の表現ルール

親Todoがある場合、親子関係は`-`（ハイフン）で区切って表現する。

**形式:**
```
dep-<変換された親Todo名>-<変換された子Todo名>
```

**例:**
- 親Todo: `Write Letter`、子Todo: `Buy Card`
  → `dep-Write_Letter-Buy_Card`

### 完全な変換例

| 親Todo名 | 子Todo名 | 生成されるラベル名 |
|---------|---------|-----------------|
| なし | `Write Letter` | `dep-Write_Letter` |
| なし | `Buy Birthday Card` | `dep-Buy_Birthday_Card` |
| `Write Letter` | `Buy Card` | `dep-Write_Letter-Buy_Card` |
| `Project Planning` | `Create Timeline` | `dep-Project_Planning-Create_Timeline` |

## 文字数制限

ラベル名は50文字以内に制限する。50文字を超える場合は切り詰める。

## 特殊文字の扱い

- **空白** → `_`（アンダーバー）に変換
- **既存のハイフン** → そのまま保持
- **その他の特殊文字** → そのまま保持

## 自動化動作

### ラベル生成タイミング

- 新しいgoalTodoが作成された時
- 定期実行（1時間毎）で既存goalTodoをチェック

### ラベル削除タイミング

- goalTodoが完了・削除された時
- 定期実行で不要になったラベルをクリーンアップ

### 重複回避

既に同名のラベルが存在する場合は、新規作成をスキップする。

## 実装上の注意点

### 混乱しやすい点

1. **空白の変換**: 空白は`_`（アンダーバー）
2. **親子の区切り**: 親子関係は`-`（ハイフン）
3. **順序**: `dep-<親>-<子>` の形式

### 間違いやすい例

❌ **間違い**: `dep-Write_Letter_Buy_Card` （親子を`_`で区切り）
✅ **正解**: `dep-Write_Letter-Buy_Card` （親子を`-`で区切り）

❌ **間違い**: `dep-Write-Letter-Buy-Card` （空白を`-`に変換）
✅ **正解**: `dep-Write_Letter-Buy_Card` （空白を`_`に変換）

## 使用目的

生成されたdep-ラベルは、フロントエンドでのTodoフィルタリングに使用される：

1. ユーザーがdep-ラベルをTodoに手動で付与
2. そのTodoを依存関係により表示から除外
3. 依存元のgoalTodoが完了すると、対応するdep-ラベルが自動削除される

## テストケース

実装時は以下のケースを必ずテストする：

- 基本パターン（親なし・親あり）
- 空白を含む名前
- 長い名前（50文字制限）
- 日本語を含む名前
- 特殊文字を含む名前
- エッジケース（空文字、空白のみ）