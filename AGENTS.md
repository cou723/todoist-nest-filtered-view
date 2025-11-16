# Agent Notes

本リポジトリの期間集計（Todoist 完了件数）に関する重要メモ。

- 目的: 「過去7日間平均」を先頭日から欠損なく描画する。
- 方針: 表示対象日数に対して先行6日ぶんを追加取得し、移動平均の計算には先読みを含むデータ列を用いる。
- 実装ポイント:
  - `TodoDailyCompletionController.fetchDailyCompletionStats(days)` は `days + 6` 日ぶん取得し、
    - `statsForAverage` に「先頭6日 + 表示対象`days`」を保持。
    - `dailyCompletionStats` は UI 表示用として直近 `days` のみに制限。
  - 7日平均は `getSevenDayAverageDataForChart()` で算出。
    - 可視領域 i 日目の平均は `statsForAverage.slice(i, i + 7)` の合計/件数。
    - 当日がある場合は、`statsForAverage` の末尾6日と当日を合算して平均化。
  - UI はラベル・合計ともに「表示対象日数（`visibleDays`）」に同期。

既定動作: 表示は90日（3か月）とし、取得は97日（+6日）です。

## ドキュメント
- ドキュメントは基本的にdocs/に配置してください。
- 現在は以下のドキュメントが配置されています 
  - [requirements.md](./docs/requirements.md) :フルリプレイス予定のフロントエンドの要求について書いてあります
  - [functional-requirements.md](./docs/functional-requirements.md) :フルリプレイス予定のフロントエンドの機能要件について書いてあります。
  - [non-functional-requirements.md](./docs/non-functional-requirements.md) :フルリプレイス予定のフロントエンドの非機能要件について書いてあります。
  - [frontend-tech-stack.md](./docs/frontend-tech-stack.md) :フルリプレイス予定のフロントエンドの選定済み技術スタックについて書いてあります。