import { TodoistApi } from "@doist/todoist-api-typescript";
import type { Task } from "@doist/todoist-api-typescript";
import type { TaskWithParent } from "../types/task.js";

export class TodoistService {
  private api: TodoistApi;
  private parentTaskCache: Map<string, string> = new Map();
  private allTasksCache: Map<string, Task> = new Map();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

  constructor(token: string) {
    this.api = new TodoistApi(token);
  }

  private async getAllTasks(): Promise<TaskWithParent[]> {
    const response = await this.api.getTasks();
    // 全タスクをキャッシュに保存
    this.updateTasksCache(response.results);
    return this.enrichTasksWithParentNames(response.results);
  }

  public async getTasksByFilter(query?: string): Promise<TaskWithParent[]> {
    if (!query || !query.trim()) {
      // queryが空または未指定の場合は全件取得
      return this.getAllTasks();
    }
    const response = await this.api.getTasksByFilter({ query });
    // フィルタリング結果もキャッシュに追加（既存のキャッシュは保持）
    this.updateTasksCache(response.results, false);
    return this.enrichTasksWithParentNames(response.results);
  }

  private updateTasksCache(tasks: Task[], clearCache = true) {
    const now = Date.now();

    // キャッシュが古い場合はクリア
    if (now - this.cacheTimestamp > this.CACHE_DURATION) {
      this.allTasksCache.clear();
      this.parentTaskCache.clear();
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

  private async enrichTasksWithParentNames(
    tasks: Task[]
  ): Promise<TaskWithParent[]> {
    const enrichedTasks: TaskWithParent[] = [];
    const parentIdsToFetch: Set<string> = new Set();

    // 必要な親タスクIDを収集（キャッシュにないもののみ）
    for (const task of tasks) {
      if (
        task.parentId &&
        !this.parentTaskCache.has(task.parentId) &&
        !this.allTasksCache.has(task.parentId)
      ) {
        parentIdsToFetch.add(task.parentId);
      }
    }

    // 不足している親タスクを一括取得
    if (parentIdsToFetch.size > 0) {
      await this.fetchMissingParentTasks(parentIdsToFetch);
    }

    // 祖タスクIDも収集
    const grandparentIdsToFetch: Set<string> = new Set();
    for (const task of tasks) {
      if (task.parentId && this.allTasksCache.has(task.parentId)) {
        const parentTask = this.allTasksCache.get(task.parentId)!;
        if (
          parentTask.parentId &&
          !this.parentTaskCache.has(parentTask.parentId) &&
          !this.allTasksCache.has(parentTask.parentId)
        ) {
          grandparentIdsToFetch.add(parentTask.parentId);
        }
      }
    }

    // 不足している祖タスクを一括取得
    if (grandparentIdsToFetch.size > 0) {
      await this.fetchMissingParentTasks(grandparentIdsToFetch);
    }

    // タスクを親タスク名と祖タスク名で拡張
    for (const task of tasks) {
      const enrichedTask: TaskWithParent = { ...task };

      if (task.parentId) {
        // キャッシュから親タスク名を取得
        let parentTaskName = this.parentTaskCache.get(task.parentId);

        // キャッシュにない場合は、allTasksCacheから取得
        if (!parentTaskName && this.allTasksCache.has(task.parentId)) {
          const parentTask = this.allTasksCache.get(task.parentId)!;
          parentTaskName = parentTask.content;
          this.parentTaskCache.set(task.parentId, parentTaskName);
        }

        enrichedTask.parentTaskName = parentTaskName || "不明な親タスク";
        enrichedTask.parentTaskId = task.parentId;

        // 祖タスク名も取得
        if (this.allTasksCache.has(task.parentId)) {
          const parentTask = this.allTasksCache.get(task.parentId)!;
          if (parentTask.parentId) {
            let grandparentTaskName = this.parentTaskCache.get(
              parentTask.parentId
            );

            if (
              !grandparentTaskName &&
              this.allTasksCache.has(parentTask.parentId)
            ) {
              const grandparentTask = this.allTasksCache.get(
                parentTask.parentId
              )!;
              grandparentTaskName = grandparentTask.content;
              this.parentTaskCache.set(
                parentTask.parentId,
                grandparentTaskName
              );
            }

            enrichedTask.grandparentTaskName =
              grandparentTaskName || "不明な祖タスク";
            enrichedTask.grandparentTaskId = parentTask.parentId;
          }
        }
      }

      enrichedTasks.push(enrichedTask);
    }

    return enrichedTasks;
  }

  private async fetchMissingParentTasks(parentIds: Set<string>) {
    const fetchPromises = Array.from(parentIds).map(async (parentId) => {
      try {
        const parentTask = await this.api.getTask(parentId);
        this.parentTaskCache.set(parentId, parentTask.content);
        this.allTasksCache.set(parentId, parentTask);
      } catch (e) {
        // 親タスク取得に失敗した場合
        this.parentTaskCache.set(parentId, "不明な親タスク");
      }
    });

    await Promise.all(fetchPromises);
  }

  // タスクを完了にする
  public async completeTask(taskId: string): Promise<void> {
    await this.api.closeTask(taskId);
    // キャッシュからタスクを削除
    this.allTasksCache.delete(taskId);
  }

  // キャッシュをクリアするメソッド（必要に応じて使用）
  public clearCache() {
    this.parentTaskCache.clear();
    this.allTasksCache.clear();
    this.cacheTimestamp = 0;
  }
}
