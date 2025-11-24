# フロントエンド設計ノート

本ドキュメントは、現行 `frontend-lit-legacy` 実装の主要機能と API 依存関係を整理し、LLM が参照しやすい形でまとめたものです。

## 1. 機能概要

### 1.1 認証（Authentication）

**実装場所**: `frontend-lit-legacy/src/controllers/auth-controller.ts`, `frontend-lit-legacy/src/services/oauth-service.ts`

**振る舞い**:
- Todoist OAuth 2.0 を使用した認証フロー
- 未認証時は「Todoistでログイン」ボタンのみを表示
- 認証ボタン押下で Todoist OAuth 認可画面にリダイレクト
- CSRF 対策として `state` パラメータを localStorage と sessionStorage の両方に保存
- OAuth リダイレクト後、`code` と `state` をクエリパラメータから取得
- `state` を検証（UUID形式チェック、保存値との一致確認）
- OAuth プロキシに対してコード交換リクエストを送信
- 取得したアクセストークンを `localStorage.todoist_token` に保存
- 認証成功後、`isAuthenticated` を `true` にして各パネルを初期化
- ログアウト時は localStorage 上の認証情報（トークン、`oauth_state` 等）を削除

**依存 API**:
- Todoist OAuth 認可エンドポイント: `https://todoist.com/oauth/authorize`
- OAuth プロキシ: `POST /oauth/token` (詳細は後述)

**状態管理**:
- `isAuthenticated`: 認証状態（boolean）
- `isProcessingAuth`: 認証処理中フラグ（boolean）
- `authError`: 認証エラーメッセージ（string）
- localStorage: `todoist_token`, `oauth_state`, `todoist_token_expires_at`
- sessionStorage: `oauth_state`

### 1.2 タスク一覧（Task List with Filter）

**実装場所**: `frontend-lit-legacy/src/controllers/filtered-task-controller.ts`, `frontend-lit-legacy/src/services/todoist-service.ts`

**振る舞い**:
- Todoist のフィルタクエリを使用してタスクを取得・表示
- フィルタクエリは空文字列を含む任意の文字列（例: `today`, `p1`, `@label` など）
- タスクはツリー構造で表示され、親タスク情報も含む
- カーソルベースのページングで全件取得（最大数百件を想定）
- 親タスクが複数階層ある場合は再帰的に取得してツリーノードを構築
- フィルタクエリと dep 非表示設定は localStorage に保存され、再訪問時に復元
- フィルタ入力は 500ms のデバウンス後に自動適用
- `dep-` で始まるラベルを持つ（または祖先に持つ）タスクの非表示機能
- タスク行からの完了操作（`closeTask` API 呼び出し）

**依存 API**:
- Todoist REST API: `GET /rest/v2/tasks` (フィルタなし)
- Todoist REST API: `GET /rest/v2/tasks?filter={query}` (フィルタあり)
- Todoist REST API: `GET /rest/v2/tasks/{id}` (親タスク取得)
- Todoist REST API: `POST /rest/v2/tasks/{id}/close` (タスク完了)

**パフォーマンス前提**:
- 中規模（〜500件程度）のタスク数を想定
- 全ページ取得により初回ロードは遅くなるが、その後はキャッシュで高速化
- 大量のタスク（1000件超）の場合、初回ロードやリフィルタリング時のレスポンス低下あり

**設定項目**:
- Todoist フィルタクエリ文字列（localStorage: `filter_query`）
- dep 系タスク非表示設定（localStorage: `hide_dep_tasks`）

### 1.3 ゴールマイルストーン率（Goal Milestone Panel）

**実装場所**: `frontend-lit-legacy/src/controllers/goal-milestone-controller.ts`

**振る舞い**:
- `@goal` ラベルを持つタスクを取得
- その中で `@non-milestone` ラベルを持つタスクの割合を算出
- 表示項目:
  - 非マイルストーンゴール Todo率（%）
  - 分子／分母の件数（`@non-milestone` 件数 / `@goal` 件数）
- エラー時は「読み込み中」「エラー」などの状態を表示

**依存 API**:
- Todoist REST API: `GET /rest/v2/tasks?filter=@goal`

**ラベル依存**:
- `@goal`: ゴールタスクを示すラベル
- `@non-milestone`: マイルストーン未設定のゴールを示すラベル（Cron サービスが自動付与）

### 1.4 日付付きゴール（Date Goal Panel）

**実装場所**: `frontend-lit-legacy/src/controllers/date-goal-controller.ts`

**振る舞い**:
- フィルタ `@goal & !日付なし` を使用してタスクを取得
- `due.date` が存在し、かつ「今日以降」のタスクのみを表示（過去日付は除外）
- 各タスクの「日付までの残日数」を算出
- 残日数が少ない順（昇順）に並べて表示
- 残日数に応じて表示ラベルと色クラスを切り替え:
  - `overdue`: 期限切れ
  - `today`: 今日
  - `urgent`: 緊急（1〜3日以内）
  - `soon`: もうすぐ（4〜7日以内）
  - `normal`: 通常（8日以上）
- 対象タスクが0件の場合、「日付付きゴールタスクがありません」と表示

**依存 API**:
- Todoist REST API: `GET /rest/v2/tasks?filter=@goal & !日付なし`

**日付処理**:
- `date-fns` を使用してローカルタイムゾーン基準で計算
- 「今日」「明日」「N日前／あとN日」を判定

### 1.5 作業完了統計（Task Daily Completion Panel）

**実装場所**: `frontend-lit-legacy/src/controllers/task-daily-completion-controller.ts`, `frontend-lit-legacy/src/services/todoist-sync-service.ts`

**振る舞い**:
- Todoist Sync API v1 をプロキシ経由で呼び出して完了履歴を取得
- 表示対象日数: 90日（3か月）
- 取得対象日数: 97日（90 + 6日先行取得）※7日移動平均の先頭日計算のため
- 対象タスク条件:
  - `@毎日のタスク` ラベルを含むタスクは除外
  - `@task` ラベルを含むタスク、またはコンテンツ末尾が「のマイルストーンを置く」で終わるマイルストーンタスク
- 完了履歴の取得は最大90日のチャンクに分割（API制約）
- カーソル付きで完了済みタスクをすべて取得後、日単位に集計
- グラフ表示:
  - 過去90日分の履歴 + 当日分（別API取得）を結合
  - 日付ラベルは `month/day` 形式の日本ロケール表示
  - 「過去7日間平均」系列のみを折れ線グラフで描画
- パネル上部に表示:
  - 表示対象期間の完了合計件数
  - 現在残っている `@task` の件数
- 「データを取得しなおす」ボタンで統計再取得

**依存 API**:
- Todoist REST API v1: `GET /v1/tasks/completed/by_completion_date` (プロキシ経由)
- Todoist REST API: `GET /rest/v2/tasks?filter=@task` (残りタスク数取得)

**期間集計ロジック（重要）**:
```
表示日数: 90日（visibleDays）
取得日数: 97日（visibleDays + 6）
先読み分: 6日（7日移動平均のため）

内部データ構造:
- statsForAverage: 97日分のデータ（先頭6日 + 表示対象90日）
- dailyCompletionStats: 表示用90日分のデータ
- todayTodoStat: 当日統計（別API取得）

7日移動平均の計算:
- 可視領域 i 日目の平均 = statsForAverage.slice(i, i+7) の合計 / 7
- 当日がある場合は、statsForAverage の末尾6日 + 当日の合計 / 7
- これにより、先頭日から欠損なく7日平均を描画可能
```

**バリデーション**:
- `valibot` を使用して API レスポンスを検証
- 想定外のデータ形式の場合は明示的にエラーを投げる

**日付処理**:
- 完了日時 `completed_at` をローカルタイムに変換
- `yyyy-MM-dd` 単位で集約して「1日あたりの完了件数」を算出
- 当日の統計は「当日 0:00 〜 翌日 0:00」の範囲

### 1.6 テーマ切り替え（Theme Toggle）

**実装場所**: `frontend-lit-legacy/src/services/theme-service.ts`

**振る舞い**:
- `light` / `dark` の2種類のテーマを提供
- 現在のテーマを `documentElement[data-theme]` に反映
- 初回ロード時、localStorage のテーマを優先、未設定時は OS の `prefers-color-scheme` に従う
- テーマ変更は localStorage に保存され、ページ再読み込み後も継続
- ワンクリックでテーマ切り替え可能

**状態管理**:
- localStorage: `theme` (`light` または `dark`)

## 2. Todoist API・OAuth プロキシ エンドポイント一覧

### 2.1 Todoist REST API v2

現行フロントエンドが使用する主要なエンドポイント:

#### タスク取得（フィルタなし）
- **エンドポイント**: `GET https://api.todoist.com/rest/v2/tasks`
- **パラメータ**: `cursor` (optional, ページング用)
- **ヘッダー**: `Authorization: Bearer {access_token}`
- **レスポンス**:
  ```json
  {
    "results": [
      {
        "id": "task_id",
        "content": "タスク名",
        "labels": ["goal", "task"],
        "parentId": "parent_task_id",
        "due": {
          "date": "2024-01-01",
          "isRecurring": false
        },
        "isCompleted": false,
        ...
      }
    ],
    "nextCursor": "cursor_string_or_null"
  }
  ```

#### タスク取得（フィルタあり）
- **エンドポイント**: `GET https://api.todoist.com/rest/v2/tasks`
- **パラメータ**: 
  - `filter`: Todoist フィルタクエリ（例: `@goal`, `today`, `p1`）
  - `cursor` (optional, ページング用)
- **ヘッダー**: `Authorization: Bearer {access_token}`
- **レスポンス**: 上記と同じ

#### 単一タスク取得
- **エンドポイント**: `GET https://api.todoist.com/rest/v2/tasks/{id}`
- **ヘッダー**: `Authorization: Bearer {access_token}`
- **レスポンス**: Task オブジェクト（上記と同様）

#### タスク完了
- **エンドポイント**: `POST https://api.todoist.com/rest/v2/tasks/{id}/close`
- **ヘッダー**: `Authorization: Bearer {access_token}`
- **レスポンス**: 204 No Content

### 2.2 Todoist REST API v1（完了済みタスク）

#### 完了済みタスク取得（完了日時順）
- **エンドポイント**: `GET https://api.todoist.com/api/v1/tasks/completed/by_completion_date`
- **パラメータ**:
  - `since`: 開始日時（ISO 8601形式、optional）
  - `until`: 終了日時（ISO 8601形式、optional）
  - `limit`: 1ページあたりの件数（最大50、default 50）
  - `cursor`: ページングカーソル（optional）
- **ヘッダー**: `Authorization: Bearer {access_token}`
- **レスポンス**:
  ```json
  {
    "items": [
      {
        "id": "task_id",
        "content": "タスク名 @task",
        "completed_at": "2024-01-01T12:00:00Z",
        "project_id": "project_id",
        "user_id": "user_id"
      }
    ],
    "next_cursor": "cursor_string_or_null"
  }
  ```
- **注意**: 
  - レスポンスには `labels` フィールドが含まれないため、`content` から `@ラベル` を抽出する
  - 期間は最大90日まで（それ以上は複数リクエストで分割取得）

### 2.3 Todoist OAuth

#### 認可エンドポイント
- **エンドポイント**: `GET https://todoist.com/oauth/authorize`
- **パラメータ**:
  - `client_id`: OAuth アプリケーションのクライアントID
  - `scope`: 権限スコープ（カンマ区切り、例: `data:read_write,data:delete`）
  - `state`: CSRF対策用のランダム文字列（UUID形式）
  - `redirect_uri`: コールバックURL
  - `response_type`: `code` (固定)
- **レスポンス**: ユーザー認可後、`redirect_uri` に `code` と `state` をクエリパラメータで返す

#### トークン交換エンドポイント
- **エンドポイント**: `POST https://todoist.com/oauth/access_token`
- **パラメータ** (application/x-www-form-urlencoded):
  - `client_id`: OAuth アプリケーションのクライアントID
  - `client_secret`: OAuth アプリケーションのクライアントシークレット
  - `code`: 認可コード
  - `redirect_uri`: コールバックURL（認可時と同一）
- **レスポンス**:
  ```json
  {
    "access_token": "access_token_string",
    "token_type": "Bearer"
  }
  ```
- **注意**: CORS制約のため、フロントエンドから直接呼び出し不可（プロキシ経由）

#### トークン無効化エンドポイント
- **エンドポイント**: `POST https://todoist.com/oauth/revoke_token`
- **パラメータ** (application/x-www-form-urlencoded):
  - `client_id`: OAuth アプリケーションのクライアントID
  - `client_secret`: OAuth アプリケーションのクライアントシークレット
  - `access_token`: 無効化するアクセストークン
- **レスポンス**: 204 No Content

### 2.4 OAuth プロキシエンドポイント

**実装場所**: `proxy/main.ts`

OAuth プロキシは Deno Deploy で稼働し、フロントエンドと Todoist OAuth API の間を中継します。

#### トークン交換
- **エンドポイント**: `POST {PROXY_URL}/oauth/token`
- **リクエストボディ** (application/json):
  ```json
  {
    "client_id": "oauth_client_id",
    "code": "authorization_code",
    "redirect_uri": "callback_url"
  }
  ```
- **レスポンス**:
  ```json
  {
    "access_token": "access_token_string",
    "token_type": "Bearer"
  }
  ```
- **処理内容**:
  - `client_secret` を環境変数から取得
  - Todoist トークン交換エンドポイントに中継
  - レスポンスをそのままフロントエンドに返す

#### トークン無効化
- **エンドポイント**: `POST {PROXY_URL}/oauth/revoke`
- **リクエストボディ** (application/json):
  ```json
  {
    "client_id": "oauth_client_id",
    "access_token": "access_token_string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true
  }
  ```

#### 完了済みタスク取得（中継）
- **エンドポイント**: `GET {PROXY_URL}/v1/tasks/completed/by_completion_date`
- **パラメータ**: Todoist API v1 のパラメータをそのまま中継
- **ヘッダー**: `Authorization: Bearer {access_token}`
- **処理内容**:
  - クエリパラメータをそのまま Todoist API v1 に転送
  - Authorization ヘッダーもそのまま転送
  - レスポンスをそのままフロントエンドに返す

#### CORS設定
- **許可オリジン**: 環境変数 `ALLOWED_ORIGIN`（デフォルト: `http://localhost:5173`）
- **許可メソッド**: `GET`, `POST`, `OPTIONS`
- **許可ヘッダー**: `Content-Type`, `Authorization`

#### 環境変数
- `TODOIST_CLIENT_SECRET`: Todoist OAuth アプリケーションのクライアントシークレット（必須）
- `ALLOWED_ORIGIN`: CORS許可オリジン（デフォルト: `http://localhost:5173`）

## 3. 期間集計ロジック詳細（90日表示・97日取得・7日移動平均）

### 3.1 要件

- **表示対象**: 過去90日分（3か月）の完了統計
- **取得対象**: 過去97日分（90 + 6日先行）
- **先読み理由**: 7日移動平均を先頭日から欠損なく描画するため
- **当日の扱い**: 別APIで取得し、グラフの末尾に追加

### 3.2 実装詳細

**実装場所**: `frontend-lit-legacy/src/controllers/task-daily-completion-controller.ts`

#### データ構造

```typescript
// 内部保持データ
private statsForAverage: DailyCompletionStat[] = [];  // 97日分（先頭6日 + 表示90日）
private visibleDays = 90;                             // 表示対象日数

// 公開データ
public dailyCompletionStats: DailyCompletionStat[] = []; // 表示用90日分
public todayTodoStat: TodayTaskStat | null = null;       // 当日統計

interface DailyCompletionStat {
  date: string;        // yyyy-MM-dd 形式
  count: number;       // 完了件数
  displayDate: string; // 表示用日付（M/d 形式）
}

interface TodayTaskStat {
  date: string;        // yyyy-MM-dd 形式
  completedCount: number;
  displayDate: string;
}
```

#### 取得フロー

```typescript
// 1. 履歴データ取得（97日分）
public async fetchDailyCompletionStats(days: number = 90) {
  // 先頭日から7日平均を表示するため、6日分前倒しで取得
  const fetchDays = Math.max(0, days + 6); // 97日
  const full = await this.todoistSyncService.getDailyCompletionStats(fetchDays);
  
  this.visibleDays = days;           // 90日
  this.statsForAverage = full;       // 97日分
  this.dailyCompletionStats = full.slice(-days); // 直近90日のみ表示用に保持
}

// 2. 当日統計取得（別API）
public async fetchTodayTodoStats() {
  this.todayTodoStat = await this.todoistSyncService.getTodayTodoStats();
}
```

#### 7日移動平均の計算

```typescript
public getSevenDayAverageDataForChart(): number[] {
  // 表示用データ（90日 + 当日）
  const visible = [...this.dailyCompletionStats];
  if (this.todayTodoStat) {
    visible.push({
      date: this.todayTodoStat.date,
      count: this.todayTodoStat.completedCount,
      displayDate: this.todayTodoStat.displayDate,
    });
  }

  // 先読み分を含むバックデータ（97日）
  const base = [...this.statsForAverage];
  const averages: number[] = [];
  const visibleDaysCount = this.dailyCompletionStats.length; // 90日

  // 可視領域（当日除く）の各日について7日平均を計算
  for (let i = 0; i < visibleDaysCount; i++) {
    // i日目の7日平均 = base[i] から7日分の平均
    // 例: i=0（先頭日）の場合、base[0..6] の7日分
    //     i=1（2日目）の場合、base[1..7] の7日分
    const window = base.slice(i, i + 7);
    const sum = window.reduce((s, st) => s + (st?.count ?? 0), 0);
    const denom = window.length || 1;
    averages.push(sum / denom);
  }

  // 当日分の7日平均
  if (this.todayTodoStat) {
    const last6 = base.slice(-6);  // 直近6日
    const sum6 = last6.reduce((s, st) => s + (st?.count ?? 0), 0);
    const sum7 = sum6 + this.todayTodoStat.completedCount; // 直近6日 + 当日
    const denom = last6.length + 1;
    averages.push(sum7 / denom);
  }

  return averages; // 91個の要素（90日 + 当日）
}
```

#### 図解

```
取得日数: 97日
├─ 先読み分: 6日（7日平均のため）
└─ 表示分: 90日
   └─ 当日: 別API取得

例: 2024-01-01 を表示先頭日とする場合
- 取得範囲: 2023-12-26 〜 2024-03-30（97日）
- 表示範囲: 2024-01-01 〜 2024-03-30（90日）
- 当日: 2024-03-31（別取得）

先頭日（2024-01-01）の7日平均:
  = (2023-12-26 + 12-27 + 12-28 + 12-29 + 12-30 + 12-31 + 2024-01-01) / 7

2日目（2024-01-02）の7日平均:
  = (2023-12-27 + 12-28 + 12-29 + 12-30 + 12-31 + 2024-01-01 + 01-02) / 7

...

最終日（2024-03-30）の7日平均:
  = (2024-03-24 + 03-25 + 03-26 + 03-27 + 03-28 + 03-29 + 03-30) / 7

当日（2024-03-31）の7日平均:
  = (2024-03-25 + 03-26 + 03-27 + 03-28 + 03-29 + 03-30 + 03-31) / 7
```

### 3.3 API制約への対応

Todoist API v1 の完了済みタスク取得は、期間を最大90日までしか指定できません。97日分を取得する場合でも、実装では90日のチャンクに分割しているため、1回のリクエストで取得できます。

```typescript
// todoist-sync-service.ts での実装
public async getDailyCompletionStats(days: number = 30): Promise<DailyCompletionStat[]> {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const MAX_WINDOW_DAYS = 90;
  const untilExclusiveAll = startOfDay(addDays(endDate, 1));
  let remaining = days;
  let untilExclusive = untilExclusiveAll;
  const completedTasks: CompletedTask[] = [];
  
  // 期間を後ろから最大90日ずつに分割して取得
  while (remaining > 0) {
    const chunkDays = Math.min(MAX_WINDOW_DAYS, remaining);
    const sinceInclusive = subDays(untilExclusive, chunkDays);
    
    const chunk = await this.getCompletedTasksWithTaskLabel(
      sinceInclusive.toISOString(),
      untilExclusive.toISOString()
    );
    completedTasks.push(...chunk);
    
    untilExclusive = sinceInclusive;
    remaining -= chunkDays;
  }
  
  // 日付別に集計
  // ...
}
```

### 3.4 グラフ表示

- **使用ライブラリ**: 現行は未確認（新フロントエンドでは Recharts を使用予定）
- **系列**: 「過去7日間平均」のみ（折れ線グラフ）
- **X軸**: 日付ラベル（M/d 形式）
- **Y軸**: 完了件数
- **データポイント数**: 91個（表示90日 + 当日）

## 4. Cron 自動化サービス

**実装場所**: `cron/main.ts`

Cron サービスは Deno Deploy の `Deno.cron` 機能を使用して1時間おきに実行されます。

### 4.1 主要機能

#### @non-milestone ラベルの自動管理
- `@goal` ラベルを持ち、`@non-milestone` を持たず、かつ子タスクに `@task` または `@goal` を持たないタスクを「葉ゴール」として特定
- 葉ゴールに対して `@non-milestone` ラベルを付与
- `@goal` と `@non-milestone` の両方を持つタスクで、子タスクに `@task` または `@goal` を持つものから `@non-milestone` ラベルを削除

#### マイルストーンタスクの自動作成
- `@goal` かつ `@non-milestone` ラベルを持つタスクで、子にマイルストーン系タスク（「のマイルストーンを置く」等）を持たないものに対して、新たに「${ゴール名}のマイルストーンを置く」という子タスクを作成

#### 依存関係ラベル（dep-*）の管理
- `@goal` タスクを対象に、親子関係に基づく依存関係ラベル名（`dep-*`）を生成
- 存在しないラベルについては新規作成
- 現在の `@goal` タスク集合から導出されるべき `dep-*` ラベル名の集合と、実際に存在する `dep-*` ラベルとの比較により、不要となった `dep-*` ラベルを削除

### 4.2 環境変数
- `TODOIST_TOKEN`: Todoist API アクセストークン（システム全体で共有、必須）

### 4.3 パフォーマンス
- タスク取得やラベル操作に5分程度のキャッシュを利用
- 同一ラベルのタスク取得やラベル一覧取得を短時間に繰り返す際の API 呼び出し回数を抑制

## 5. ラベル命名規則

現行実装は以下のラベルに依存しています:

- `@goal`: ゴールタスクを示すラベル
- `@task`: 作業タスクを示すラベル
- `@non-milestone`: マイルストーン未設定のゴールを示すラベル（Cron サービスが自動付与）
- `dep-*`: 依存関係を示すラベル（Cron サービスが自動生成・削除）
- `@毎日のタスク`: 日次タスクを示すラベル（完了統計から除外）
- `日付なし`: 日付なしタスクを示すラベル（日付付きゴールから除外）

## 6. エラーハンドリング

### 6.1 フロントエンド

- 各パネルは独立したエラーステートとローディングステートを持つ
- 特定のAPI呼び出しが失敗しても他パネルの表示に影響を与えない
- API レスポンスは `valibot` で検証し、想定外のデータ形式の場合は明示的にエラー
- タスク完了処理では、HTTPステータスコードに応じて詳細なエラーメッセージを生成:
  - 401: 認証エラー
  - 403: 権限エラー
  - 404: タスクが存在しない
  - 400: 無効なタスクID

### 6.2 OAuth プロキシ

- HTTPステータスが成功でない場合、エラーメッセージをそのままフロントエンドに返す
- フロントエンド側で詳細なエラー内容をログまたはUIで参照可能

### 6.3 Cron サービス

- 各ステップ（`@non-milestone` 付与／削除、マイルストーン作成、依存ラベル生成・削除）の進捗とエラーをログ出力
- エラー発生時にも全体のプロセスが落ちずにログから原因を把握できる

## 7. セキュリティ・プライバシー

- OAuth 認証で `state` パラメータを使用してCSRF攻撃を防止
- アクセストークンはブラウザの localStorage に保存
- サーバー側にユーザー単位のトークンを永続保存するバックエンドは持たない
- OAuth プロキシは環境変数 `ALLOWED_ORIGIN` によって許可オリジンを制限
- Cron サービスの `TODOIST_TOKEN` はサーバー環境変数として保持、CLI引数やログには出力しない
- タスク内容から `@ラベル` を抽出するが、それ以外の機微情報を別ストレージに保存したり第三者に送信したりしない

## 8. 開発・デプロイ前提

### 8.1 フロントエンド
- **技術スタック**: Lit（Web Components）、TypeScript、Vite
- **静的ホスティング**: Vercel などの静的サイトホスティングサービス
- **ローカル開発**: `http://localhost:5173` で稼働
- **環境変数**:
  - `VITE_TODOIST_CLIENT_ID`: Todoist OAuth クライアントID
  - `VITE_REDIRECT_URI`: OAuth コールバックURL
  - `VITE_PROXY_URL`: OAuth プロキシURL（デフォルト: `http://localhost:8000`）

### 8.2 OAuth プロキシ
- **技術スタック**: Deno、Deno Deploy
- **デプロイ**: GitHub リポジトリとの連携による自動デプロイ
- **ローカル開発**: `http://localhost:8000` で稼働
- **環境変数**:
  - `TODOIST_CLIENT_SECRET`: Todoist OAuth クライアントシークレット（必須）
  - `ALLOWED_ORIGIN`: CORS許可オリジン（デフォルト: `http://localhost:5173`）

### 8.3 Cron サービス
- **技術スタック**: Deno、Deno Deploy
- **実行間隔**: 1時間おき（`Deno.cron`）
- **デプロイ**: GitHub リポジトリとの連携による自動デプロイ
- **ローカル開発**: `deno task start` で手動実行
- **環境変数**:
  - `TODOIST_TOKEN`: Todoist API アクセストークン（システム全体で共有、必須）

## 9. 既知の制約・前提

### 9.1 パフォーマンス
- 中規模（〜500件程度）のタスク数を想定
- 大規模（1000件超）の場合、初回ロードや再フィルタリング時のレスポンス低下の可能性
- 仮想スクロールやページング表示は未実装

### 9.2 日付・時刻
- `date-fns` を使用してローカルタイムゾーン基準で計算
- タイムゾーンごとの日付境界の違いは利用環境に依存

### 9.3 ラベル命名規則
- 運用ルールとして事前に Todoist 側で整備されていることを前提
- アプリ側はラベルを変更しない（Cron サービスが自動付与・削除のみ）

### 9.4 トークン管理
- リフレッシュトークン運用は未実装
- トークン有効期限は `localStorage.todoist_token_expires_at` で管理可能だが、実際の有効期限チェックは簡易的

## 10. 将来のリプレイス時のチェックポイント

新フロントエンド実装時に確認すべき項目:

- [ ] OAuth 認証フロー（state検証、トークン保存）
- [ ] タスク一覧のツリー表示（親子関係の再帰取得）
- [ ] フィルタクエリの適用とデバウンス
- [ ] dep 系タスクの非表示機能
- [ ] ゴールマイルストーン率の計算
- [ ] 日付付きゴールの表示（残日数計算、色分け）
- [ ] 完了統計の期間集計ロジック（90日表示、97日取得、7日移動平均）
- [ ] 当日統計の別API取得と結合
- [ ] テーマ切り替え（localStorage保存、OSテーマ優先）
- [ ] エラーハンドリング（パネル単位の独立性）
- [ ] バリデーション（valibot）
- [ ] ラベル命名規則の依存関係
- [ ] プロキシ経由のAPI呼び出し（CORS対応）

---

以上が現行 `frontend-lit-legacy` 実装の主要機能と API 依存関係の整理です。
