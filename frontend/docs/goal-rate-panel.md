# Goal Rate Panel 実装方針

## スコープ
- React 版 GoalRatePanel の実装方針メモ。旧 Lit 版「非マイルストーンゴールTodo率」の表示を置き換える。
- 分母は @goal ラベル付きタスク全件、分子は @non-milestone ラベルを含むゴールタスク。期間集計はなし。

## ユースケース
- `fetchGoalRate`（想定）: `TaskRepository.getAll("@goal")` でゴールタスクを取得し、`non-milestone` ラベルの件数と全件数から百分率（四捨五入、分母0なら0%）を返す。追加の永続化・キャッシュは行わない。
- 依存ポート: `TaskRepository` の `getAll` のみ。別設定リポジトリは不要。

## UI 要件（GoalRatePanel）
- 初期表示で 1 回だけ `fetchGoalRate` を実行。手動リロードやポーリングは行わない。
- 表示内容: タイトル「非マイルストーンゴールTodo率」、大きめの百分率、説明文「@non-milestone タスクの割合」、件数詳細 `nonMilestoneCount / goalCount タスク`。旧 Lit 版と同等トーンを維持。
- 状態表示: ローディングスピナー、ゴールタスク0件時の空メッセージ。エラー時はトースト表示＋パネル内の簡易文言のみでよい。
- パフォーマンス最適化は不要（全件 fetch 前提）。

## 今後の拡張余地
- 手動再取得ボタンや自動更新間隔の追加。
- 色分け閾値や非マイルストーン判定条件のカスタマイズ。
