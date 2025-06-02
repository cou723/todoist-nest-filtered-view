import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { TaskWithParent } from "../types/task.js";
import { TodoistService } from "../services/todoist-service.js";

export interface TaskControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class TaskController implements ReactiveController {
  private host: TaskControllerHost;
  private todoistService: TodoistService | null = null;
  private currentRequestController: AbortController | null = null;

  // 状態
  public tasks: TaskWithParent[] = [];
  public loading: boolean = false;
  public error: string = "";

  constructor(host: TaskControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    // コントローラーがホストに接続された時の処理
  }

  hostDisconnected() {
    // 進行中のリクエストをキャンセル
    this.cancelCurrentRequest();
  }

  // サービスの初期化
  initializeService(token: string) {
    this.todoistService = new TodoistService(token);
  }

  // サービスのクリア
  clearService() {
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

  // 全タスクの取得
  async fetchAllTasks(): Promise<void> {
    if (!this.todoistService) return;

    this.cancelCurrentRequest();
    this.currentRequestController = new AbortController();

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      this.tasks = await this.todoistService.getAllTasks();
    } catch (e: any) {
      // AbortErrorの場合は無視（意図的なキャンセル）
      if (e.name === "AbortError") {
        return;
      }
      this.error = "タスク取得に失敗しました: " + (e?.message || e);
      this.tasks = [];
    } finally {
      this.loading = false;
      this.currentRequestController = null;
      this.host.requestUpdate();
    }
  }

  // フィルタによるタスク取得
  async fetchTasksByFilter(query: string): Promise<void> {
    if (!this.todoistService || !query.trim()) return;

    this.cancelCurrentRequest();
    this.currentRequestController = new AbortController();

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      this.tasks = await this.todoistService.getTasksByFilter(query);
    } catch (e: any) {
      // AbortErrorの場合は無視（意図的なキャンセル）
      if (e.name === "AbortError") {
        return;
      }
      this.error = "フィルタリングに失敗しました: " + (e?.message || e);
      this.tasks = [];
    } finally {
      this.loading = false;
      this.currentRequestController = null;
      this.host.requestUpdate();
    }
  }

  // タスクを完了にする
  async completeTask(taskId: string): Promise<void> {
    if (!this.todoistService) return;

    try {
      await this.todoistService.completeTask(taskId);
      // ローカルのタスクリストからも削除
      this.tasks = this.tasks.filter((task) => task.id !== taskId);
      this.host.requestUpdate();
    } catch (e: any) {
      this.error = "タスクの完了に失敗しました: " + (e?.message || e);
      this.host.requestUpdate();
    }
  }

  // サービスの再初期化（キャッシュクリア付き）
  reinitializeService(token: string) {
    if (this.todoistService) {
      this.todoistService.clearCache();
    }
    this.initializeService(token);
  }
}
