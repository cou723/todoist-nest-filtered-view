import { TodoistApi } from "@doist/todoist-api-typescript";
import type {
  GetTasksResponse,
  Task as Todo,
} from "@doist/todoist-api-typescript";
import type { TodoNode as TodoNode } from "../types/task.js";

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
  private allTodosCache: Map<string, Todo> = new Map();
  private pendingFetches: Map<string, Promise<Todo | undefined>> = new Map();

  constructor(token: string) {
    this.api = new TodoistApi(token);
  }

  public async getTodosTree(query?: string): Promise<TodoNode[]> {
    const todos = await this.fetchTodosByFilter(query);
    return (
      await Promise.all(todos.map((t) => this.fetchTodoNode(t.id)))
    ).filter((t) => t != undefined);
  }

  /**
   * フィルタリングされたタスクを全ページ取得
   * 注意: 全ページを取得するため、大量のタスクがある場合は初回ロードが遅くなる可能性がある
   */
  public async fetchTodosByFilter(query?: string): Promise<Todo[]> {
    let allTodos: Todo[] = [];
    let cursor: string | null = null;

    do {
      const response: GetTasksResponse = query
        ? await this.api.getTasksByFilter({ query, cursor })
        : await this.api.getTasks({ cursor });

      allTodos.push(...response.results);
      cursor = response.nextCursor;
    } while (cursor !== null);

    allTodos.forEach((t) => {
      this.allTodosCache.set(t.id, t);
    });
    return allTodos;
  }

  private async fetchTodo(id: string): Promise<Todo | undefined> {
    const cachedTodo = this.allTodosCache.get(id);
    if (cachedTodo) {
      return cachedTodo;
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
      const todo = await fetchPromise;
      return todo;
    } finally {
      // リクエスト完了後にpendingFetchesから削除
      this.pendingFetches.delete(id);
    }
  }

  private async performFetch(id: string): Promise<Todo | undefined> {
    try {
      // console.log(`APIからタスクを取得: ${id}`);
      const todo = await this.api.getTask(id);
      this.allTodosCache.set(id, todo);
      return todo;
    } catch (error) {
      console.error(`タスクの取得に失敗しました: ${error}`);
      return undefined;
    }
  }

  private async fetchTodoNode(id: string): Promise<TodoNode | undefined> {
    const todo = await this.fetchTodo(id);
    if (!todo) return undefined;

    return {
      ...todo,
      parent: todo?.parentId
        ? await this.fetchTodoNode(todo.parentId)
        : undefined,
    };
  }

  // タスクを完了にする
  public async completeTodo(id: string): Promise<void> {
    await this.api.closeTask(id);
    // キャッシュからタスクを削除
    this.allTodosCache.delete(id);
  }

  // キャッシュをクリアするメソッド（必要に応じて使用）
  public clearCache() {
    this.allTodosCache.clear();
  }
}
