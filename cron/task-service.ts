/**
 * タスクサービス
 * Todoistタスクの取得・管理・操作を統括するサービス層
 */

import { TodoistApi } from "todoist";
import type { Task, Label } from "todoist";

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
  private labelCache = new Map<string, Label[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  constructor(api: TodoistApi) {
    this.api = api;
  }

  /**
   * 指定されたラベルのタスクを取得（キャッシュ対応）
   */
  async getTodosByLabel(label: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    const filteredTasks = allTasks.filter((task) =>
      task.labels?.includes(label)
    );
    console.log(
      `Filtered ${filteredTasks.length} @${label} tasks from all tasks`,
    );
    return filteredTasks;
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
      !task.labels?.includes("non-milestone")
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
      task.labels?.includes("non-milestone")
    );
    const taskTodos = todos.filter((t) => t.labels?.includes("task"));
    const goalTodos = todos.filter((t) => t.labels?.includes("goal"));

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
    const tasksResult = await this.api.getTasks();
    const tasks: Task[] = Array.isArray(tasksResult)
      ? tasksResult
      : (tasksResult as any).items || (tasksResult as any).data || [];

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
    this.labelCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 手動でキャッシュをクリア
   */
  public invalidateCache(): void {
    this.clearCache();
  }

  /**
   * 全てのラベルを取得
   */
  async getLabels(): Promise<Label[]> {
    const now = Date.now();
    const cacheKey = "all_labels";

    // キャッシュチェック
    if (this.labelCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      console.log("Using cached labels");
      return this.labelCache.get(cacheKey)!;
    }

    console.log("Fetching labels from API");
    const labelsResult = await this.api.getLabels();
    const labels: Label[] = Array.isArray(labelsResult)
      ? labelsResult
      : (labelsResult as any).items || (labelsResult as any).data || [];

    // キャッシュに保存
    this.labelCache.set(cacheKey, labels);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

    console.log(`Retrieved ${labels.length} labels from API`);
    return labels;
  }

  /**
   * ラベルを作成（重複チェック付き）
   */
  async createLabel(name: string): Promise<Label | null> {
    // 既存ラベルとの重複チェック
    const existingLabels = await this.getLabels();
    const duplicate = existingLabels.find(label => label.name === name);

    if (duplicate) {
      console.log(`Label "${name}" already exists, skipping creation`);
      return duplicate;
    }

    console.log(`Creating new label: ${name}`);
    const newLabel = await this.api.addLabel({ name });

    // キャッシュをクリア（変更があったため）
    this.clearCache();

    return newLabel;
  }

  /**
   * ラベルを削除
   */
  async deleteLabel(labelId: string): Promise<void> {
    await this.api.deleteLabel(labelId);

    // キャッシュをクリア（変更があったため）
    this.clearCache();
  }

  /**
   * 名前でラベルを検索
   */
  async findLabelByName(name: string): Promise<Label | null> {
    const labels = await this.getLabels();
    return labels.find(label => label.name === name) || null;
  }

  /**
   * dep-で始まるラベルを全て取得
   */
  async getDepLabels(): Promise<Label[]> {
    const labels = await this.getLabels();
    return labels.filter(label => label.name.startsWith('dep-'));
  }
}
