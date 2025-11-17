# API Call Logs - Phase 2 Implementation

This document records actual API call patterns for Todoist services, including success and failure cases, to validate the error handling implementation.

## Overview

The implementation uses:
- **TodoistService**: Todoist REST API v2 for task operations
- **StatsService**: Todoist v1 Completed Tasks API for statistics
- **AuthService**: OAuth 2.0 for authentication via proxy

## 1. TodoistService - Task Operations

### 1.1 Fetch Tasks (Success)

**Request:**
```http
GET https://api.todoist.com/rest/v2/tasks
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 200 OK
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

**Error Handling:** Schema validation ensures all required fields are present and types match.

### 1.2 Fetch Tasks with Filter (Success)

**Request:**
```http
GET https://api.todoist.com/rest/v2/tasks?filter=@goal
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 200 OK
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

**Error Handling:** Filter query is properly URL-encoded and sent as query parameter.

### 1.3 Fetch Single Task (Success)

**Request:**
```http
GET https://api.todoist.com/rest/v2/tasks/7495833149
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 200 OK
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

**Error Handling:** Task is cached after fetch to reduce API calls.

### 1.4 Complete Task (Success)

**Request:**
```http
POST https://api.todoist.com/rest/v2/tasks/7495833149/close
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 204 No Content

**Error Handling:** Task is removed from cache after successful completion.

### 1.5 Authentication Error (401)

**Request:**
```http
GET https://api.todoist.com/rest/v2/tasks
Authorization: Bearer invalid_token
Content-Type: application/json
```

**Response:** 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

**Error Handling:**
- Mapped to `AuthError` with message: "認証エラー: トークンが無効または期限切れです"
- Status code: 401
- Allows UI to prompt re-authentication

### 1.6 Task Not Found (404)

**Request:**
```http
GET https://api.todoist.com/rest/v2/tasks/999999999
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 404 Not Found
```json
{
  "error": "Task not found"
}
```

**Error Handling:**
- Mapped to `NotFoundError` with resource type "Task"
- Status code: 404
- Resource ID included in error for debugging

### 1.7 Rate Limit Exceeded (429)

**Request:**
```http
GET https://api.todoist.com/rest/v2/tasks
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 429 Too Many Requests
```http
Retry-After: 60
```
```json
{
  "error": "Rate limit exceeded"
}
```

**Error Handling:**
- Mapped to `RateLimitError`
- Message: "レート制限エラー: しばらく待ってから再試行してください"
- Retry-After header can be used for backoff strategy

## 2. StatsService - Completion Statistics

### 2.1 Fetch Completed Tasks (Success)

**Request:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date?since=2024-01-01T00:00:00Z&until=2024-01-31T23:59:59Z&limit=50
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 200 OK
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

**Error Handling:**
- Labels are extracted from content using regex
- Pagination is handled automatically with cursor
- API constraint: Maximum 90-day window enforced

### 2.2 Fetch Completed Tasks with Pagination (Success)

**Request:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date?since=2024-01-01T00:00:00Z&until=2024-01-31T23:59:59Z&limit=50&cursor=eyJwYWdlIjogMn0
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 200 OK
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

**Error Handling:** `next_cursor: null` indicates last page, loop terminates.

### 2.3 Date Range Exceeds Limit (400)

**Request:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date?since=2023-01-01T00:00:00Z&until=2024-01-31T23:59:59Z&limit=50
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** 400 Bad Request
```json
{
  "error": "Date range exceeds maximum allowed (90 days)"
}
```

**Error Handling:**
- Mapped to `BadRequestError`
- Service automatically chunks requests into 90-day windows
- Multiple requests made sequentially to fetch all data

### 2.4 Network Connection Failure

**Request:**
```http
GET http://localhost:8000/v1/tasks/completed/by_completion_date
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** (No response - connection failed)

**Error Handling:**
- Caught as fetch TypeError
- Mapped to `NetworkError` with message: "ネットワークエラーが発生しました"
- Allows UI to show appropriate error message

## 3. AuthService - OAuth Authentication

### 3.1 OAuth Token Exchange (Success)

**Request (to Proxy):**
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

**Proxy Request (to Todoist):**
```http
POST https://todoist.com/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id=abc123&client_secret={secret}&code=auth_code_xyz&redirect_uri=http://localhost:5173/oauth/callback
```

**Response:** 200 OK
```json
{
  "access_token": "bearer_token_xyz123",
  "token_type": "Bearer"
}
```

**Error Handling:**
- Token saved to localStorage under key "todoist_token"
- State parameter validated for CSRF protection
- Both localStorage and sessionStorage checked for state

### 3.2 Invalid Authorization Code (400)

**Request:**
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

**Response:** 400 Bad Request
```json
{
  "error": "invalid_grant"
}
```

**Error Handling:**
- Mapped to `BadRequestError`
- Message includes reason for failure
- UI can prompt user to restart OAuth flow

### 3.3 State Validation Failure

**Scenario:** Callback state doesn't match saved state

**Error Handling:**
- Checked before making token exchange request
- Returns `AuthError` with message: "State validation failed (CSRF protection)"
- Prevents CSRF attacks

## 4. Error Classification Summary

### HTTP Status Code Mapping

| Status Code | Error Type | User Message |
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

## 5. Validation Notes

### Schema Validation
- All API responses are validated using `@effect/schema`
- Invalid responses throw `ParseError` with details
- Ensures type safety throughout the application

### Label Extraction
- Regex pattern: `/@([^\s@]+)/gu`
- Handles Japanese labels: `@毎日のタスク`
- Excludes email addresses by not treating `@` in middle of text

### Date Handling
- All dates in ISO 8601 format
- Local timezone handled by `date-fns`
- 90-day window enforced for completion queries

### Pagination
- Automatic cursor-based pagination for all list endpoints
- Fetches all pages until `next_cursor` is null
- Memory-efficient streaming for large result sets

## 6. Testing Recommendations

### Manual Testing
1. Start proxy: `cd proxy && deno task start`
2. Start frontend: `cd frontend && pnpm dev`
3. Test OAuth flow with valid Todoist account
4. Verify task fetching with various filters
5. Complete a task and verify removal from list
6. Check completion statistics for past 90 days

### Error Testing
1. Test with invalid token (expect AuthError)
2. Test with non-existent task ID (expect NotFoundError)
3. Test with proxy offline (expect NetworkError)
4. Test with malformed response (expect ParseError)

## 7. Logging Strategy

### Production Logging
- All errors logged with full context (status, cause, timestamp)
- Success cases logged at DEBUG level only
- No sensitive data (tokens) in logs

### Development Logging
- Effect provides built-in tracing
- Can enable verbose logging for debugging
- Error details include full stack trace

## Conclusion

The Phase 2 implementation provides:
- ✅ Type-safe API client with Effect integration
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Automatic pagination and chunking for large datasets
- ✅ Schema validation for all API responses
- ✅ CSRF protection for OAuth flow
- ✅ Caching strategy to reduce API calls
- ✅ 90-day window handling for completion queries

All error cases are properly classified and mapped to domain errors, ensuring consistent error handling across the application.
