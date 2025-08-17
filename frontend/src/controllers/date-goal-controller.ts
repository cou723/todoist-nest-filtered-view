import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Task as Todo } from "@doist/todoist-api-typescript";
import { TodoistService } from "../services/todoist-service.js";
import { differenceInDays, isAfter, startOfDay } from "date-fns";

export interface DateGoalControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export interface DateGoalTodo extends Todo {
  daysUntilDate: number;
}

export class DateGoalController implements ReactiveController {
  private host: DateGoalControllerHost;
  private todoistService: TodoistService | null = null;

  // 状態
  public dateGoalTodos: DateGoalTodo[] = [];
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
    this.fetchDateGoalTodos();
  }

  // サービスのクリア
  public clearService() {
    this.todoistService = null;
    this.dateGoalTodos = [];
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // 日付付きGoalTodoの取得
  public async fetchDateGoalTodos() {
    if (!this.todoistService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      const todos = await this.todoistService.fetchTodosByFilter(
        "@goal & !日付なし"
      );

      const todosWithDate = todos.filter((t) => {
        if (!t.due || !t.due.date) return false;

        // 今日以降の日付のタスクのみを含める
        const todoDate = new Date(t.due.date + "T00:00:00");
        const today = startOfDay(new Date());

        return (
          isAfter(todoDate, today) || todoDate.getTime() === today.getTime()
        );
      });

      this.dateGoalTodos = todosWithDate
        .map((t) => ({
          ...t,
          daysUntilDate: this.calculateDaysUntilDate(t.due?.date ?? ""),
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
    const today = startOfDay(new Date());
    const targetDate = new Date(dateString + "T00:00:00");

    return differenceInDays(targetDate, today);
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
