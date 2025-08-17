import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { TodoNode } from "../types/task.js";
import { TodoistService } from "../services/todoist-service.js";
import { hasDepLabelInAncestors } from "../utils/task-utils.js";

export interface FilteredTodoControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class FilteredTodoController implements ReactiveController {
  private host: FilteredTodoControllerHost;
  private todoistService: TodoistService | null = null;
  private currentRequestController: AbortController | null = null;

  // 状態
  public todos: TodoNode[] = [];
  public loading = false;
  public error = "";

  constructor(host: FilteredTodoControllerHost) {
    this.host = host;
    host.addController(this);
  }

  public hostConnected() {
    // コントローラーがホストに接続された時の処理
  }

  public hostDisconnected() {
    // 進行中のリクエストをキャンセル
    this.cancelCurrentRequest();
  }

  // サービスの初期化
  public initializeService(token: string) {
    this.todoistService = new TodoistService(token);
  }

  // TodoistServiceへのアクセス
  public getTodoistService(): TodoistService | null {
    return this.todoistService;
  }

  // サービスのクリア
  public clearService() {
    this.cancelCurrentRequest();
    this.todoistService = null;
    this.todos = [];
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // 進行中のリクエストをキャンセル
  private cancelCurrentRequest() {
    if (this.currentRequestController) {
      this.currentRequestController.abort();
      this.currentRequestController = null;
    }
  }

  // フィルタによるタスク取得
  public async fetchTodosByFilter(query?: string, hideDepTodos?: boolean): Promise<void> {
    if (!this.todoistService) return;

    this.cancelCurrentRequest();
    this.currentRequestController = new AbortController();

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      let todos = await this.todoistService.getTodosTree(query);
      
      // dep-系タグフィルタリングを適用
      if (hideDepTodos) {
        todos = this.filterDepTodos(todos);
      }
      
      this.todos = todos;
    } catch (e: unknown) {
      if (e instanceof Error) {
        // AbortErrorの場合は無視（意図的なキャンセル）
        if (e.name === "AbortError") return;
        this.error = "フィルタリングに失敗しました: " + (e?.message || e);
      }
      this.todos = [];
    } finally {
      this.loading = false;
      this.currentRequestController = null;
      this.host.requestUpdate();
    }
  }

  // タスクを完了にする
  public async completeTodo(taskId: string): Promise<void> {
    if (!this.todoistService) return;

    try {
      await this.todoistService.completeTodo(taskId);
      // ローカルのタスクリストからも削除
      this.todos = this.todos.filter((task) => task.id !== taskId);
      this.host.requestUpdate();
    } catch (e: unknown) {
      if (e instanceof Error)
        this.error = "タスクの完了に失敗しました: " + (e.message || e);
      else this.error = "タスクの完了に失敗しました: " + String(e);
      this.host.requestUpdate();
    }
  }

  // dep-系タグを持つTodoをフィルタリングする
  private filterDepTodos(todos: TodoNode[]): TodoNode[] {
    return todos.filter(todo => !hasDepLabelInAncestors(todo));
  }

  // サービスの再初期化（キャッシュクリア付き）
  public reinitializeService(token: string) {
    if (this.todoistService) {
      this.todoistService.clearCache();
    }
    this.initializeService(token);
  }
}
