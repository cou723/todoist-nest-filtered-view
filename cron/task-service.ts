/**
 * タスクサービス
 * Todoistタスクの取得・管理・操作を統括するサービス層
 */

import { TodoistApi } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import type { Task } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";

/**
 * タスクフィルタの設定
 */
export interface TodoFilters {
  goal?: boolean;
  task?: boolean;
  nonMilestone?: boolean;
}

/**
 * タスクデータ取得関数の型
 */
export interface TodoDataProvider {
  goalTodos: () => Promise<Task[]>;
  taskTodos: () => Promise<Task[]>;
  nonMilestoneTodos: () => Promise<Task[]>;
}

/**
 * タスク分析結果
 */
export interface TodoAnalysis {
  leafGoalTodos: Task[];
  nonMilestoneParentTodos: Task[];
}

/**
 * タスクサービス
 * Todoistタスクの効率的な取得・キャッシング・分析を提供
 */
export class TodoService {
  private api: TodoistApi;
  private taskCache = new Map<string, Task[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  constructor(api: TodoistApi) {
    this.api = api;
  }

  /**
   * 指定されたラベルのタスクを取得（キャッシュ対応）
   */
  private async getTodosByLabel(label: string): Promise<Task[]> {
    const now = Date.now();
    const cacheKey = `@${label}`;

    // キャッシュチェック
    if (this.taskCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      console.log(`Using cached ${label} tasks`);
      return this.taskCache.get(cacheKey)!;
    }

    console.log(`Fetching ${label} tasks from API`);
    const tasks = await this.api.getTasks({ filter: `@${label}` });

    // キャッシュに保存
    this.taskCache.set(cacheKey, tasks);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    console.log(`Retrieved ${tasks.length} @${label} tasks from API`);
    return tasks;
  }

  /**
   * 必要なタスクを一括取得
   */
  async getAllRequiredTodos(): Promise<{
    goalTodos: Task[];
    taskTodos: Task[];
    nonMilestoneTodos: Task[];
  }> {
    const [goalTodos, taskTodos, nonMilestoneTodos] = await Promise.all([
      this.getTodosByLabel("goal"),
      this.getTodosByLabel("task"),
      this.getTodosByLabel("non-milestone"),
    ]);

    return { goalTodos, taskTodos, nonMilestoneTodos };
  }

  /**
   * 子タスクを持たないゴールタスクを検索
   */
  static findLeafGoalTodos(
    goalTodos: readonly Task[],
    taskTodos: readonly Task[],
    nonMilestoneTodos: readonly Task[],
  ): Task[] {
    const unlabeledGoalTodos = goalTodos.filter((task) =>
      !task.labels.includes("non-milestone")
    );

    console.log(
      `Found ${unlabeledGoalTodos.length} goal todos without non-milestone label`,
    );

    // 子タスクとして使用される可能性のあるタスク群
    const allPotentialChildren = [...taskTodos, ...nonMilestoneTodos];

    return unlabeledGoalTodos.filter((goalTodo) => {
      const hasAnyChildren = allPotentialChildren.some((t) =>
        t.parentId === goalTodo.id
      );

      if (hasAnyChildren) {
        console.log(
          `Goal todo "${goalTodo.content}" has children, skipping milestone creation`,
        );
      }

      return !hasAnyChildren;
    });
  }

  /**
   * @taskまたは@goalの子タスクを持つ@non-milestoneタスクを検索
   */
  static findNonMilestoneParentTodos(todos: readonly Task[]): Task[] {
    const nonMilestoneTodos = todos.filter((task) =>
      task.labels.includes("non-milestone")
    );
    const taskTodos = todos.filter((t) => t.labels.includes("task"));
    const goalTodos = todos.filter((t) => t.labels.includes("goal"));

    console.log(`Found ${nonMilestoneTodos.length} non-milestone todos`);

    return nonMilestoneTodos.filter((nonMilestoneTask) => {
      const hasTaskOrGoalChildren = taskTodos.some((t) =>
        t.parentId === nonMilestoneTask.id
      ) || goalTodos.some((t) => t.parentId === nonMilestoneTask.id);

      console.log(
        `Non-milestone todo "${nonMilestoneTask.content}" (ID: ${nonMilestoneTask.id}) has @task or @goal children: ${hasTaskOrGoalChildren}`,
      );

      return hasTaskOrGoalChildren;
    });
  }

  /**
   * タスクを分析して処理対象を特定（データ取得関数を受け取る版）
   */
  static async analyzeTasksForAutomation(
    dataProvider: TodoDataProvider,
  ): Promise<TodoAnalysis> {
    const [goalTodos, taskTodos, nonMilestoneTodos] = await Promise.all([
      dataProvider.goalTodos(),
      dataProvider.taskTodos(),
      dataProvider.nonMilestoneTodos(),
    ]);

    // 全タスクを結合
    const allTasks = [...goalTodos, ...taskTodos, ...nonMilestoneTodos];

    return {
      leafGoalTodos: TodoService.findLeafGoalTodos(
        goalTodos,
        taskTodos,
        nonMilestoneTodos,
      ),
      nonMilestoneParentTodos: TodoService.findNonMilestoneParentTodos(
        allTasks,
      ),
    };
  }

  /**
   * このインスタンスのデータプロバイダーを取得
   */
  getDataProvider(): TodoDataProvider {
    return {
      goalTodos: () => this.getTodosByLabel("goal"),
      taskTodos: () => this.getTodosByLabel("task"),
      nonMilestoneTodos: () => this.getTodosByLabel("non-milestone"),
    };
  }

  /**
   * タスクを更新
   */
  async updateTask(
    taskId: string,
    updates: { labels?: string[] },
  ): Promise<void> {
    await this.api.updateTask(taskId, updates);
    // キャッシュをクリア（変更があったため）
    this.clearCache();
  }

  /**
   * タスクを追加
   */
  async addTodo(task: {
    content: string;
    parentId?: string;
    labels?: string[];
  }): Promise<void> {
    await this.api.addTask(task);
    // キャッシュをクリア（変更があったため）
    this.clearCache();
  }

  /**
   * 全てのタスクを取得
   */
  async getAllTasks(): Promise<Task[]> {
    const now = Date.now();
    const cacheKey = "all_tasks";

    // キャッシュチェック
    if (this.taskCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      console.log("Using cached all todos");
      return this.taskCache.get(cacheKey)!;
    }

    console.log("Fetching all todos from API");
    const tasks = await this.api.getTasks();

    // キャッシュに保存
    this.taskCache.set(cacheKey, tasks);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    console.log(`Retrieved ${tasks.length} todos from API`);
    return tasks;
  }

  /**
   * マイルストーンを書く系のタスクを特定
   */
  static findMilestoneTodos(tasks: readonly Task[]): Task[] {
    return tasks.filter((task) =>
      task.content.includes("のマイルストーンを") ||
      task.content.includes("マイルストーンを置く") ||
      task.content.includes("マイルストーンを書く")
    );
  }

  /**
   * タスクを削除
   */
  async deleteTask(taskId: string): Promise<void> {
    await this.api.deleteTask(taskId);
    // キャッシュをクリア（変更があったため）
    this.clearCache();
  }

  /**
   * キャッシュをクリア
   */
  private clearCache(): void {
    this.taskCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 手動でキャッシュをクリア
   */
  public invalidateCache(): void {
    this.clearCache();
  }
}
