# API 呼び出しログ - Phase 2 実装

このドキュメントは、Todoist サービスの実際の API 呼び出しパターンを記録し、成功ケースと失敗ケースを含めて、エラーハンドリング実装を検証するためのものです。

## 概要

実装では以下を使用します：
- **TodoistService**: タスク操作のための Todoist REST API v2
- **StatsService**: 統計のための Todoist v1 Completed Tasks API
- **AuthService**: プロキシ経由の OAuth 2.0 認証

## 1. TodoistService - タスク操作

### 1.1 タスク取得（成功）

**リクエスト:**
```http
GET https://api.todoist.com/rest/v2/tasks
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 200 OK
```json
[
  {
    "id": "7495833149",
    "project_id": "2203306141",
    "content": "Sample Task @task",
    "description": "",
    "is_completed": false,
    "labels": ["task"],
    "parent_id": null,
    "order": 1,
    "priority": 1,
    "due": null,
    "url": "https://todoist.com/showTask?id=7495833149",
    "comment_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "creator_id": "123456"
  }
]
```

**エラーハンドリング:** スキーマ検証により、すべての必須フィールドが存在し、型が一致することを保証します。

### 1.2 フィルタ付きタスク取得（成功）

**リクエスト:**
```http
GET https://api.todoist.com/rest/v2/tasks?filter=@goal
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 200 OK
```json
[
  {
    "id": "7495833150",
    "project_id": "2203306141",
    "content": "Goal Task @goal",
    "description": "",
    "is_completed": false,
    "labels": ["goal"],
    "parent_id": null,
    "order": 1,
    "priority": 1,
    "due": {
      "date": "2024-12-31",
      "string": "Dec 31",
      "lang": "en",
      "is_recurring": false
    },
    "url": "https://todoist.com/showTask?id=7495833150",
    "comment_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "creator_id": "123456"
  }
]
```

**エラーハンドリング:** フィルタクエリは適切に URL エンコードされ、クエリパラメータとして送信されます。

### 1.3 単一タスク取得（成功）

**リクエスト:**
```http
GET https://api.todoist.com/rest/v2/tasks/7495833149
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 200 OK
```json
{
  "id": "7495833149",
  "project_id": "2203306141",
  "content": "Sample Task @task",
  "description": "",
  "is_completed": false,
  "labels": ["task"],
  "parent_id": null,
  "order": 1,
  "priority": 1,
  "due": null,
  "url": "https://todoist.com/showTask?id=7495833149",
  "comment_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "creator_id": "123456"
}
```

**エラーハンドリング:** API 呼び出しを削減するため、取得後にタスクがキャッシュされます。

### 1.4 タスク完了（成功）

**リクエスト:**
```http
POST https://api.todoist.com/rest/v2/tasks/7495833149/close
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 204 No Content

**エラーハンドリング:** 正常に完了した後、タスクはキャッシュから削除されます。

### 1.5 認証エラー（401）

**リクエスト:**
```http
GET https://api.todoist.com/rest/v2/tasks
Authorization: Bearer invalid_token
Content-Type: application/json
```

**レスポンス:** 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

**エラーハンドリング:**
- メッセージ「認証エラー: トークンが無効または期限切れです」で `AuthError` にマッピング
- ステータスコード: 401
- UI が再認証を促すことができます

### 1.6 タスクが見つからない（404）

**リクエスト:**
```http
GET https://api.todoist.com/rest/v2/tasks/999999999
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 404 Not Found
```json
{
  "error": "Task not found"
}
```

**エラーハンドリング:**
- リソースタイプ "Task" で `NotFoundError` にマッピング
- ステータスコード: 404
- デバッグ用にリソース ID がエラーに含まれます

### 1.7 レート制限超過（429）

**リクエスト:**
```http
GET https://api.todoist.com/rest/v2/tasks
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 429 Too Many Requests
```http
Retry-After: 60
```
```json
{
  "error": "Rate limit exceeded"
}
```

**エラーハンドリング:**
- `RateLimitError` にマッピング
- メッセージ: 「レート制限エラー: しばらく待ってから再試行してください」
- Retry-After ヘッダーをバックオフ戦略に使用できます

## 2. StatsService - 完了統計

### 2.1 完了済みタスク取得（成功）

**リクエスト:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date?since=2024-01-01T00:00:00Z&until=2024-01-31T23:59:59Z&limit=50
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 200 OK
```json
{
  "items": [
    {
      "id": "7495833151",
      "completed_at": "2024-01-15T10:30:00Z",
      "content": "Completed Task @task",
      "project_id": "2203306141",
      "user_id": "123456"
    },
    {
      "id": "7495833152",
      "completed_at": "2024-01-16T14:20:00Z",
      "content": "プロジェクトAのマイルストーンを置く",
      "project_id": "2203306141",
      "user_id": "123456"
    }
  ],
  "next_cursor": "eyJwYWdlIjogMn0"
}
```

**エラーハンドリング:**
- ラベルは正規表現を使用してコンテンツから抽出されます
- ページネーションはカーソルで自動的に処理されます
- API 制約: 最大 90 日のウィンドウが強制されます

### 2.2 ページネーション付き完了済みタスク取得（成功）

**リクエスト:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date?since=2024-01-01T00:00:00Z&until=2024-01-31T23:59:59Z&limit=50&cursor=eyJwYWdlIjogMn0
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 200 OK
```json
{
  "items": [
    {
      "id": "7495833153",
      "completed_at": "2024-01-17T09:15:00Z",
      "content": "Another Task @task",
      "project_id": "2203306141",
      "user_id": "123456"
    }
  ],
  "next_cursor": null
}
```

**エラーハンドリング:** `next_cursor: null` は最後のページを示し、ループが終了します。

### 2.3 日付範囲が制限を超過（400）

**リクエスト:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date?since=2023-01-01T00:00:00Z&until=2024-01-31T23:59:59Z&limit=50
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** 400 Bad Request
```json
{
  "error": "Date range exceeds maximum allowed (90 days)"
}
```

**エラーハンドリング:**
- `BadRequestError` にマッピング
- サービスは自動的にリクエストを 90 日のウィンドウに分割します
- すべてのデータを取得するために複数のリクエストが順次実行されます

### 2.4 ネットワーク接続失敗

**リクエスト:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date
Authorization: Bearer {token}
Content-Type: application/json
```

**レスポンス:** （レスポンスなし - 接続失敗）

**エラーハンドリング:**
- fetch TypeError としてキャッチ
- メッセージ「ネットワークエラーが発生しました」で `NetworkError` にマッピング
- UI が適切なエラーメッセージを表示できます

## 3. AuthService - OAuth 認証

### 3.1 OAuth トークン交換（成功）

**リクエスト（プロキシへ）:**
```http
POST http://localhost:8000/oauth/token
Content-Type: application/json
```
```json
{
  "client_id": "abc123",
  "code": "auth_code_xyz",
  "redirect_uri": "http://localhost:5173/oauth/callback"
}
```

**プロキシリクエスト（Todoist へ）:**
```http
POST https://todoist.com/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id=abc123&client_secret={secret}&code=auth_code_xyz&redirect_uri=http://localhost:5173/oauth/callback
```

**レスポンス:** 200 OK
```json
{
  "access_token": "bearer_token_xyz123",
  "token_type": "Bearer"
}
```

**エラーハンドリング:**
- トークンは "todoist_token" キーで localStorage に保存されます
- CSRF 保護のために state パラメータが検証されます
- state については localStorage と sessionStorage の両方がチェックされます

### 3.2 無効な認証コード（400）

**リクエスト:**
```http
POST http://localhost:8000/oauth/token
Content-Type: application/json
```
```json
{
  "client_id": "abc123",
  "code": "invalid_code",
  "redirect_uri": "http://localhost:5173/oauth/callback"
}
```

**レスポンス:** 400 Bad Request
```json
{
  "error": "invalid_grant"
}
```

**エラーハンドリング:**
- `BadRequestError` にマッピング
- メッセージには失敗の理由が含まれます
- UI はユーザーに OAuth フローの再開始を促すことができます

### 3.3 State 検証失敗

**シナリオ:** コールバックの state が保存された state と一致しない

**エラーハンドリング:**
- トークン交換リクエストを行う前にチェックされます
- メッセージ「State validation failed (CSRF protection)」で `AuthError` を返します
- CSRF 攻撃を防止します

## 4. エラー分類サマリー

### HTTP ステータスコードマッピング

| ステータスコード | エラー型 | ユーザーメッセージ |
|------------|------------|--------------|
| 400 | BadRequestError | リクエストエラー: {details} |
| 401 | AuthError | 認証エラー: トークンが無効または期限切れです |
| 403 | ForbiddenError | 権限エラー: この操作を実行する権限がありません |
| 404 | NotFoundError | {resource}が見つかりません |
| 429 | RateLimitError | レート制限エラー: しばらく待ってから再試行してください |
| 500-504 | ServerError | サーバーエラー: しばらく待ってから再試行してください |
| Network | NetworkError | ネットワークエラーが発生しました |
| Parse | ParseError | データ解析エラー: {details} |
| Schema | ValidationError | バリデーションエラー: {details} |

## 5. 検証メモ

### スキーマ検証
- すべての API レスポンスは `@effect/schema` を使用して検証されます
- 無効なレスポンスは詳細付きで `ParseError` をスローします
- アプリケーション全体で型安全性を保証します

### ラベル抽出
- 正規表現パターン: `/@([^\s@]+)/gu`
- 日本語ラベルを処理: `@毎日のタスク`
- テキストの途中の `@` を処理しないことでメールアドレスを除外します

### 日付処理
- すべての日付は ISO 8601 形式
- ローカルタイムゾーンは `date-fns` で処理されます
- 完了クエリには 90 日のウィンドウが強制されます

### ページネーション
- すべてのリストエンドポイントで自動カーソルベースページネーション
- `next_cursor` が null になるまですべてのページを取得します
- 大規模な結果セットのためのメモリ効率の良いストリーミング

## 6. テスト推奨事項

### 手動テスト
1. プロキシを起動: `cd proxy && deno task start`
2. フロントエンドを起動: `cd frontend-react && pnpm dev`（Legacy を検証したい場合は `frontend-lit-legacy` を使用）
3. 有効な Todoist アカウントで OAuth フローをテスト
4. さまざまなフィルタでタスク取得を確認
5. タスクを完了してリストから削除されることを確認
6. 過去 90 日間の完了統計を確認

### エラーテスト
1. 無効なトークンでテスト（AuthError を期待）
2. 存在しないタスク ID でテスト（NotFoundError を期待）
3. プロキシがオフラインの状態でテスト（NetworkError を期待）
4. 不正な形式のレスポンスでテスト（ParseError を期待）

## 7. ロギング戦略

### 本番ロギング
- すべてのエラーは完全なコンテキスト（ステータス、原因、タイムスタンプ）でログに記録されます
- 成功ケースは DEBUG レベルでのみログに記録されます
- ログに機密データ（トークン）は含まれません

### 開発ロギング
- Effect は組み込みのトレーシングを提供します
- デバッグのために詳細ログを有効にできます
- エラー詳細には完全なスタックトレースが含まれます

## まとめ

Phase 2 実装は以下を提供します：
- ✅ Effect 統合による型安全な API クライアント
- ✅ ユーザーフレンドリーなメッセージによる包括的なエラーハンドリング
- ✅ 大規模データセットのための自動ページネーションとチャンク処理
- ✅ すべての API レスポンスのスキーマ検証
- ✅ OAuth フローの CSRF 保護
- ✅ API 呼び出しを削減するキャッシング戦略
- ✅ 完了クエリの 90 日ウィンドウ処理

すべてのエラーケースは適切に分類され、ドメインエラーにマッピングされ、アプリケーション全体で一貫したエラーハンドリングを保証します。
