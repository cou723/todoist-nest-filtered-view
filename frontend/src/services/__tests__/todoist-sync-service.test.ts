import { describe, it, expect } from "vitest";
import {
  TodoistSyncService,
  type CompletedTask,
} from "../../services/todoist-sync-service.js";

// ネットワークを使わずに挙動を検証するため、getCompletedTasks をスタブ
class MockSyncService extends TodoistSyncService {
  constructor() {
    super("DUMMY");
  }

  // 完了タスクをモック: 日本語ラベル抽出と除外動作の確認用
  public async getCompletedTasks(): Promise<CompletedTask[]> {
    const base = {
      id: "1",
      project_id: "p",
      user_id: "u",
    } as const;

    return [
      // 計測対象 (@task)
      {
        ...base,
        id: "t1",
        content: "実装 @task",
        completed_at: new Date().toISOString(),
        labels: ["task"],
      },
      // 除外対象 (@毎日のタスク のみ)
      {
        ...base,
        id: "t2",
        content: "ルーチン @毎日のタスク",
        completed_at: new Date().toISOString(),
        labels: ["毎日のタスク"],
      },
      // 除外対象 (@task と @毎日のタスク の両方 → 除外が優先)
      {
        ...base,
        id: "t3",
        content: "掃除 @task @毎日のタスク",
        completed_at: new Date().toISOString(),
        labels: ["task", "毎日のタスク"],
      },
      // マイルストーン（末尾が「のマイルストーンを置く」）だが @毎日のタスク → 除外
      {
        ...base,
        id: "t4",
        content: "案件Aのマイルストーンを置く @毎日のタスク",
        completed_at: new Date().toISOString(),
        labels: ["毎日のタスク"],
      },
      // マイルストーンのみ → 計測対象
      {
        ...base,
        id: "t5",
        content: "Bのマイルストーンを置く",
        completed_at: new Date().toISOString(),
        labels: [],
      },
    ];
  }
}

describe("TodoistSyncService exclusion for @毎日のタスク", () => {
  it("excludes tasks labeled @毎日のタスク from stats", async () => {
    const svc = new MockSyncService();
    const result = await svc.getCompletedTasksWithTaskLabel();
    const ids = result.map((t) => t.id).sort();

    // 残るのは t1(@task) と t5(マイルストーン) のみ
    expect(ids).toEqual(["t1", "t5"]);
  });

  it("extracts Japanese labels and excludes them via fetch path", async () => {
    // fetch をモックして API レスポンス経由の抽出を検証
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      const now = new Date().toISOString();
      return {
        ok: true,
        json: async () => ({
          items: [
            {
              id: "x1",
              completed_at: now,
              content: "朝活 @毎日のタスク",
              project_id: "p",
              user_id: "u",
            },
            {
              id: "x2",
              completed_at: now,
              content: "実装 @task",
              project_id: "p",
              user_id: "u",
            },
          ],
        }),
      } as unknown as Response;
    }) as unknown as typeof fetch;

    try {
      const svc = new TodoistSyncService("DUMMY");
      const result = await svc.getCompletedTasksWithTaskLabel();
      const ids = result.map((t) => t.id).sort();
      // x1 は @毎日のタスク で除外、x2(@task) は残る
      expect(ids).toEqual(["x2"]);
    } finally {
      globalThis.fetch = originalFetch as typeof fetch;
    }
  });
});
