import { TodoistApi } from "@doist/todoist-api-typescript";
import type { Task } from "@doist/todoist-api-typescript";
import type { TaskNode as TaskNode } from "../types/task.js";

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

  public async fetchTasksByFilter(query?: string): Promise<Task[]> {
    const response = query
      ? await this.api.getTasksByFilter({ query })
      : await this.api.getTasks();
    const tasks = response.results;
    tasks.forEach((task) => {
      this.allTasksCache.set(task.id, task);
    });
    return tasks;
  }

  private async fetchTask(id: string): Promise<Task | undefined> {
    const cachedTask = this.allTasksCache.get(id);
    if (cachedTask) {
      console.log(`キャッシュからタスクを取得: ${id} ${cachedTask.content}`);
      return cachedTask;
    }

    // 既に同じタスクを取得中の場合は、その Promise を返す
    const pendingFetch = this.pendingFetches.get(id);
    if (pendingFetch) {
      console.log(`既存のリクエストを待機: ${id}`);
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
      console.log(`APIからタスクを取得: ${id}`);
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
