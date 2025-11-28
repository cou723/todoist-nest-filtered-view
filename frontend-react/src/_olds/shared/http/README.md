# TodoistHttpClient モックレイヤ

## 概要

`TodoistHttpClientMock` は、Todoist API を叩かずに固定データを返すモッククライアントです。
UI 開発、テスト、Storybook 的な動作確認で利用できます。

## 使用方法

### 環境変数での切り替え

`.env.local` ファイルに以下を追加するか、コマンド実行時に環境変数を設定します：

```bash
# モッククライアントを使用
VITE_USE_MOCK_CLIENT=true pnpm dev

# 実際の API を使用（デフォルト）
pnpm dev
```

### テストでの使用

```typescript
import { Effect, Layer } from "effect";
import { TodoistHttpClientMock } from "../http/mockClient";
import { TodoistServiceLive } from "../todoist/TodoistService";

const mockLayer = TodoistHttpClientMock();
const testLayer = Layer.provide(TodoistServiceLive, mockLayer);

const result = await Effect.runPromise(
  Effect.gen(function* () {
    const service = yield* TodoistService;
    return yield* service.fetchTasksByFilter();
  }).pipe(Effect.provide(testLayer))
);
```

## 提供される Fixture データ

### タスク (FIXTURE_TASKS)

- `7495833149`: Sample Task @task
- `7495833150`: Goal Task @goal
- `7495833151`: Child Task @task (親: 7495833150)

### 完了済みタスク (FIXTURE_COMPLETED_TASKS)

- `7495833152`: Completed Task @task
- `7495833153`: プロジェクトAのマイルストーンを置く
- `7495833154`: Another Task @task

### OAuth トークン (FIXTURE_OAUTH_TOKEN)

- `access_token`: mock_bearer_token_xyz123
- `token_type`: Bearer

## サポートされるエンドポイント

- `GET /tasks` - 全タスク取得
- `GET /tasks?filter=@goal` - フィルタ付きタスク取得
- `GET /tasks/:id` - 単一タスク取得
- `POST /tasks/:id/close` - タスク完了
- `GET /v1/tasks/completed/by_completion_date` - 完了済みタスク取得
- `POST /oauth/token` - OAuth トークン交換
- `DELETE /tasks/:id` - タスク削除

## 注意事項

- 現在は**成功ケースのみ**を実装しています
- エラーケース（401, 404, 429 など）は今後必要に応じて追加予定
- モックデータは `fixtures.ts` に定義されています
