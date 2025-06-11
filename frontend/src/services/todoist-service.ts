import { TodoistApi } from "@doist/todoist-api-typescript";
import type { Task } from "@doist/todoist-api-typescript";
import type { TaskNode as TaskNode } from "../types/task.js";

export class TodoistService {
  private api: TodoistApi;
  private allTasksCache: Map<string, Task> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

  constructor(token: string) {
    this.api = new TodoistApi(token);
  }

  public async getTasksTree(query?: string): Promise<TaskNode[]> {
    const response = query
      ? await this.api.getTasksByFilter({ query })
      : await this.api.getTasks();

    this.updateTasksCache(response.results, false);
    return (
      await Promise.all(
        response.results.map((task) => this.fetchTaskNode(task.id))
      )
    ).filter((t) => t != undefined);
  }

  private updateTasksCache(tasks: Task[], clearCache = true) {
    const now = Date.now();

    // キャッシュが古い場合はクリア
    if (now - this.cacheTimestamp > this.CACHE_DURATION) {
      this.allTasksCache.clear();
    }

    if (clearCache) {
      this.allTasksCache.clear();
    }

    // 新しいタスクをキャッシュに追加
    tasks.forEach((task) => {
      this.allTasksCache.set(task.id, task);
    });

    this.cacheTimestamp = now;
  }

  private async fetchTask(id: string): Promise<Task | undefined> {
    if (this.allTasksCache.has(id)) {
      return this.allTasksCache.get(id) || undefined;
    }

    try {
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
    this.cacheTimestamp = 0;
  }
}
