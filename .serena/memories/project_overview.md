# プロジェクト概要

## プロジェクトの目的

TodoistのTodoを特定の条件で取得し、親Todoの名前を含めて表示するWebアプリケーション。主な機能：

- **フィルタリング機能**: 特定のラベル（@task、@goal）でTodoを絞り込み
- **階層表示**: 親Todoの名前を含むネストされた表示
- **統計機能**: 
  - GoalTodoの@non-milestoneタグ割合統計
  - 日付付きGoalTodoの期限監視と残り日数表示
  - TaskTodoの日別完了統計グラフ
- **OAuth認証**: Todoistとの安全な認証フロー

## アーキテクチャ構成

### 3層構成のフルスタックアプリケーション

1. **フロントエンド** (`frontend/`)
   - Lit（Web Components）+ TypeScript + Vite
   - Reactive Controllerパターンによる状態管理
   - ポート: 5173（開発時）

2. **プロキシサーバー** (`proxy/`)
   - Deno + TypeScript
   - OAuth認証プロキシ、CORS対応
   - ポート: 8000、デプロイ: Deno Deploy

3. **Cronサービス** (`cron/`)
   - Deno + TypeScript
   - TodoistTodoの自動タグ管理
   - 1時間ごとの自動実行、デプロイ: Deno Deploy

## 主要技術スタック

- **フロントエンド**: Lit, TypeScript, Vite, date-fns, valibot
- **バックエンド**: Deno, TypeScript
- **外部API**: Todoist REST API v2, Todoist Sync API v9
- **開発ツール**: pnpm, ESLint, Vitest, Husky
- **デプロイ**: Vercel（フロント）, Deno Deploy（バック）

## 用語定義

- **Todo**: Todoistに登録される作業項目の総称
- **TaskTodo**: `@task`ラベルが付いたTodo（実際の作業単位）
- **GoalTodo**: `@goal`ラベルが付いたTodo（目標や大きな単位の作業）