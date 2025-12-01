# Task List Panel 実装方針

## スコープ
- React 版 TaskListPanel の実装方針メモ。現在は固定フィルタ（空文字）を使い、将来的な UI 変更を許容する。

## ユースケース追加
- `loadTaskPanelConfig`: localStorage からパネル設定を取得（現状はフィルタ文字列のみ、未設定なら空文字）。
- `updateTaskPanelConfig`: パネル設定を永続化（将来の UI フィルタ入力や非表示設定追加に備える）。
- `refreshTaskTrees`: Todoist タスクを全件取得し、表示対象のみ指定フィルタで絞り込んだうえで、親チェーン解決→優先度/階層順で整列したツリーを返す。
- `completeTask`: タスクを完了（close）し、一覧から即除外する。

## リポジトリ/ポート
- `TaskRepository`: `getAll(filter)` で `order` を含め取得、`complete(id)` で完了 API を叩く。
  - `order` は Todoist API の `Task.order`（プロジェクト内の手動並び順を表す整数）。親チェーンの `order` も参照して階層ソートの安定性を確保する。ドメイン `Task` に保持する想定。
- `ConfigRepository`（`features/config`）: `getTaskPanelConfig`/`setTaskPanelConfig` を持つ localStorage 実装（今はフィルタ文字列のみを保持）。

## UI 要件（TaskListPanel）
- hooks 越しにユースケースを呼び出す。例: `useTaskPanel`（内部で `loadTaskPanelConfig`/`refreshTaskTrees`/`completeTask` を扱う）。
- 初期表示で hook 内部が `loadTaskPanelConfig` → `refreshTaskTrees` を実行。フィルタ入力 UI は現時点なし。
- 手動リフレッシュボタンのみ（ポーリングなし）。
- 表示内容: タイトル/ラベル/期日/優先度 + 親タスクチェーン（Todoist へのリンク）。
- 期日: 旧 Lit 版と同等のフォーマット・緊急度色分け（date-fns 使用）。
- 完了ボタン: 押下で即 close → リストから除外（失敗は考慮しない前提）。
- 状態表示: ローディング/エラー/空状態を簡潔に表示。パフォーマンスは全件レンダリング前提。

## 今後の拡張余地
- フィルタ入力 UI を追加して `updateTaskFilterConfig` を呼ぶ。
- 並び替えや非表示オプション（dep ラベル除外など）を設定 UI に追加する。
