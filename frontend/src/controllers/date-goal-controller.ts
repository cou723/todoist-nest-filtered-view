import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Task } from "@doist/todoist-api-typescript";
import { TodoistService } from "../services/todoist-service.js";

export interface DateGoalControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export interface DateGoalTask extends Task {
  daysUntilDate: number;
}

export class DateGoalController implements ReactiveController {
  private host: DateGoalControllerHost;
  private todoistService: TodoistService | null = null;

  // 状態
  public dateGoalTasks: DateGoalTask[] = [];
  public loading = false;
  public error = "";

  constructor(host: DateGoalControllerHost) {
    this.host = host;
    host.addController(this);
  }

  public hostConnected() {
    // コントローラーがホストに接続された時の処理
  }

  public hostDisconnected() {
    // クリーンアップ処理
  }

  // サービスの初期化
  public initializeService(service: TodoistService) {
    this.todoistService = service;
    this.fetchDateGoalTasks();
  }

  // サービスのクリア
  public clearService() {
    this.todoistService = null;
    this.dateGoalTasks = [];
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // 日付付き@goalタスクの取得
  public async fetchDateGoalTasks() {
    if (!this.todoistService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      const tasks = await this.todoistService.fetchTasksByFilter(
        "@goal & !日付なし"
      );

      const tasksWithDate = tasks.filter((task) => {
        if (!task.due || !task.due.date) return false;

        // 今日以降の日付のタスクのみを含める
        const taskDate = new Date(task.due.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);

        return taskDate >= today;
      });

      this.dateGoalTasks = tasksWithDate
        .map((task) => ({
          ...task,
          daysUntilDate: this.calculateDaysUntilDate(task.due?.date ?? ""),
        }))
        .sort((a, b) => a.daysUntilDate - b.daysUntilDate);
    } catch {
      this.error = "日付付きゴールタスクの取得に失敗しました";
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // 日付までの日数を計算
  private calculateDaysUntilDate(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // 日付表示用のテキストを取得
  public getDaysUntilDateText(daysUntilDate: number): string {
    if (daysUntilDate < 0) {
      return `${Math.abs(daysUntilDate)}日前`;
    } else if (daysUntilDate === 0) {
      return "今日";
    } else {
      return `あと${daysUntilDate}日`;
    }
  }

  // 日付の緊急度による色クラスを取得
  public getDaysUntilDateColorClass(daysUntilDate: number): string {
    if (daysUntilDate < 0) {
      return "overdue";
    } else if (daysUntilDate === 0) {
      return "today";
    } else if (daysUntilDate <= 3) {
      return "urgent";
    } else if (daysUntilDate <= 7) {
      return "soon";
    } else {
      return "normal";
    }
  }
}
