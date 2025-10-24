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

## 開発運用ポリシー（重要）

- ローカルのサーバープロセス（例: frontend/vite、proxy/Deno）は、開発者（あなた）が起動・停止を管理します。エージェントは勝手に起動・停止しません。
  - `pnpm dev`、`dev.sh`、`proxy/start.sh` などの起動系コマンドは、明示的な指示と許可がある場合のみ実行します。
  - UI確認は可能な限りMCP経由で既存の `http://localhost:5173` に接続して行います（起動は依頼者側）。
- CORS回避のため、フロントエンドは `VITE_PROXY_URL`（既定: `http://localhost:8000`）のプロキシを利用します。プロキシの再起動が必要な変更（例: `proxy/main.ts` 更新）がある場合は、依頼者に再起動を依頼します。
- ネットワークアクセスや長時間実行、外部サービスに影響する操作は、必ず事前に合意を取ります。
