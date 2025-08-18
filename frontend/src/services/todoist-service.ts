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
    console.log("[TodoistService] completeTodo呼び出し:", {
      id,
      idType: typeof id,
      idLength: id?.length || 0,
      apiExists: !!this.api,
      apiConstructor: this.api?.constructor?.name || "unknown"
    });

    if (!id) {
      throw new Error("タスクIDが無効です");
    }

    if (typeof id !== "string" || id.trim() === "") {
      throw new Error(`タスクIDの形式が無効です: ${typeof id}, value: "${id}"`);
    }

    try {
      console.log("[TodoistService] api.closeTask呼び出し開始");
      
      // closeTaskメソッドの存在確認
      if (typeof this.api.closeTask !== "function") {
        throw new Error("api.closeTaskメソッドが存在しません");
      }

      const result = await this.api.closeTask(id);
      console.log("[TodoistService] api.closeTask完了:", {
        result,
        resultType: typeof result
      });
      
      // キャッシュからタスクを削除
      this.allTodosCache.delete(id);
    } catch (error) {
      console.error("[TodoistService] api.closeTaskエラー詳細:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : typeof error
      });
      
      // より詳細なエラーメッセージを提供
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          throw new Error("認証エラー: トークンが無効または期限切れです");
        } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
          throw new Error("権限エラー: このタスクを完了する権限がありません");
        } else if (error.message.includes("404") || error.message.includes("Not Found")) {
          throw new Error("タスクが見つかりません: タスクが既に削除されている可能性があります");
        } else if (error.message.includes("400") || error.message.includes("Bad Request")) {
          throw new Error("リクエストエラー: 無効なタスクIDです");
        } else if (error.message.includes("undefined") || error.message.includes("Required")) {
          throw new Error("バリデーションエラー: 必須パラメータが不足しています");
        }
      }
      
      throw error;
    }
  }

  // キャッシュをクリアするメソッド（必要に応じて使用）
  public clearCache() {
    this.allTodosCache.clear();
  }
}
