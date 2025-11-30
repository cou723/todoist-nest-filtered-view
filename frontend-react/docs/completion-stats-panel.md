# Completion Stats Panel 実装方針

## スコープ
- React 版 CompletionStatsPanel の設計メモ。旧 Lit 版の要件を踏襲しつつ、グラフ描画は nivo を採用する。

## 集計対象
- 「ワークタスク」= `@task` ラベル付き、またはコンテンツ末尾が「のマイルストーンを置く」で終わる完了タスク。
- 除外ラベル: `@毎日のタスク` は常時除外し、追加の除外ラベルをユーザー設定で保存・適用できる。
- 期間: 過去90日（当日を含めない履歴）+ 当日。履歴の移動平均計算のために先頭6日を余分に取得する。

## ユースケース
- `loadCompletionStatsConfig`: localStorage から除外ラベル設定を取得（未設定なら空配列）。
- `updateCompletionStatsConfig`: 除外ラベル設定を保存。
- `fetchCompletionStats`: 完了タスク履歴を取得・フィルタし、日次件数と7日移動平均を算出（履歴90日 + 先読み6日 + 当日）。
- `fetchRemainingWorkTasks`: `@task` で未完了タスクを取得し、除外ラベルを適用した件数を返す。

## リポジトリ/ポート
- `CompletionStatsRepository`: TypeScript SDK (`getCompletedTasksByCompletionDate`) で完了タスクをページング取得。`CompletedTask` をドメイン型へ正規化する。
- `TaskRepository`: 既存ポートを `fetchRemainingWorkTasks` で再利用（`@task` フィルタ + ラベル除外フィルタ）。
- `ConfigRepository`: `completionStatsConfig` を localStorage に保存/取得する実装を追加する。

## UI 要件（CompletionStatsPanel）
- hook `useCompletionStatsPanel` 内で config をロードし、依存に応じて統計/残件を自動取得（手動リフレッシュ・ポーリングなし）。
- 表示内容: タイトル「ワークタスク完了統計」、除外ラベル入力、サマリ（90日合計・当日件数・直近7日平均/合計・残り@task数）、日次件数 + 7日移動平均のラインチャート（nivo）。
- 状態表示: ローディング/エラー/空状態を簡潔に表示。UI から Todoist へのリンクは不要。

## 今後の拡張余地
- 集計期間の選択式化（30/90日切替）。
- グラフの平滑化や補間方法の選択、ダウンロードエクスポート。
