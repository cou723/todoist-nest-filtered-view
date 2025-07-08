import { TodoistApi } from "@doist/todoist-api-typescript";
import type { GetTasksResponse, Task } from "@doist/todoist-api-typescript";
import type { TaskNode as TaskNode } from "../types/task.js";

/**
 * TodoistService - Todoist API操作とキャッシュ管理
 *
 * パフォーマンス前提:
 * - 本アプリケーションは中規模のタスク数（〜500件程度）を想定
 * - 全ページ取得により初回ロードは遅くなるが、その後のキャッシュ効果で高速化
 * - 大量のタスク（1000件超）がある場合は、UI仮想化やページング表示の実装を検討
 */
export class TodoistService {
  private api: TodoistApi;
  private allTasksCache: Map<string, Task> = new Map();
  private pendingFetches: Map<string, Promise<Task | undefined>> = new Map();

  constructor(token: string) {
    this.api = new TodoistApi(token);
  }

  public async getTasksTree(query?: string): Promise<TaskNode[]> {
    const tasks = await this.fetchTasksByFilter(query);
    return (
      await Promise.all(tasks.map((task) => this.fetchTaskNode(task.id)))
    ).filter((t) => t != undefined);
  }

  /**
   * フィルタリングされたタスクを全ページ取得
   * 注意: 全ページを取得するため、大量のタスクがある場合は初回ロードが遅くなる可能性がある
   */
  public async fetchTasksByFilter(query?: string): Promise<Task[]> {
    let allTasks: Task[] = [];
    let cursor: string | null = null;

    do {
      const response: GetTasksResponse = query
        ? await this.api.getTasksByFilter({ query, cursor })
        : await this.api.getTasks({ cursor });

      allTasks.push(...response.results);
      cursor = response.nextCursor;
    } while (cursor !== null);

    allTasks.forEach((task) => {
      this.allTasksCache.set(task.id, task);
    });
    return allTasks;
  }

  private async fetchTask(id: string): Promise<Task | undefined> {
    const cachedTask = this.allTasksCache.get(id);
    if (cachedTask) {
      return cachedTask;
    }

    // 既に同じタスクを取得中の場合は、その Promise を返す
    const pendingFetch = this.pendingFetches.get(id);
    if (pendingFetch) {
      return await pendingFetch;
    }

    // 新しいリクエストを作成
    const fetchPromise = this.performFetch(id);
    this.pendingFetches.set(id, fetchPromise);

    try {
      const task = await fetchPromise;
      return task;
    } finally {
      // リクエスト完了後にpendingFetchesから削除
      this.pendingFetches.delete(id);
    }
  }

  private async performFetch(id: string): Promise<Task | undefined> {
    try {
      // console.log(`APIからタスクを取得: ${id}`);
      const task = await this.api.getTask(id);
      this.allTasksCache.set(id, task);
      return task;
    } catch (error) {
      console.error(`タスクの取得に失敗しました: ${error}`);
      return undefined;
    }
  }

  private async fetchTaskNode(id: string): Promise<TaskNode | undefined> {
    const task = await this.fetchTask(id);
    if (!task) return undefined;

    return {
      ...task,
      parent: task?.parentId
        ? await this.fetchTaskNode(task.parentId)
        : undefined,
    };
  }

  // タスクを完了にする
  public async completeTask(taskId: string): Promise<void> {
    await this.api.closeTask(taskId);
    // キャッシュからタスクを削除
    this.allTasksCache.delete(taskId);
  }

  // キャッシュをクリアするメソッド（必要に応じて使用）
  public clearCache() {
    this.allTasksCache.clear();
  }
}
