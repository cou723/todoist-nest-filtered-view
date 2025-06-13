import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { TaskNode } from "../types/task.js";
import { TodoistService } from "../services/todoist-service.js";

export interface FilteredTaskControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class FilteredTaskController implements ReactiveController {
  private host: FilteredTaskControllerHost;
  private todoistService: TodoistService | null = null;
  private currentRequestController: AbortController | null = null;

  // 状態
  public tasks: TaskNode[] = [];
  public loading = false;
  public error = "";

  constructor(host: FilteredTaskControllerHost) {
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
    this.tasks = [];
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
  public async fetchTasksByFilter(query?: string): Promise<void> {
    if (!this.todoistService) return;

    this.cancelCurrentRequest();
    this.currentRequestController = new AbortController();

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      this.tasks = await this.todoistService.getTasksTree(query);
    } catch (e: unknown) {
      if (e instanceof Error) {
        // AbortErrorの場合は無視（意図的なキャンセル）
        if (e.name === "AbortError") return;
        this.error = "フィルタリングに失敗しました: " + (e?.message || e);
      }
      this.tasks = [];
    } finally {
      this.loading = false;
      this.currentRequestController = null;
      this.host.requestUpdate();
    }
  }

  // タスクを完了にする
  public async completeTask(taskId: string): Promise<void> {
    if (!this.todoistService) return;

    try {
      await this.todoistService.completeTask(taskId);
      // ローカルのタスクリストからも削除
      this.tasks = this.tasks.filter((task) => task.id !== taskId);
      this.host.requestUpdate();
    } catch (e: unknown) {
      if (e instanceof Error)
        this.error = "タスクの完了に失敗しました: " + (e.message || e);
      else this.error = "タスクの完了に失敗しました: " + String(e);
      this.host.requestUpdate();
    }
  }

  // サービスの再初期化（キャッシュクリア付き）
  public reinitializeService(token: string) {
    if (this.todoistService) {
      this.todoistService.clearCache();
    }
    this.initializeService(token);
  }
}
