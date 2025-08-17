import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  TodoistSyncService,
  type DailyCompletionStat,
  type TodayTaskStat as TodayTodoStat,
} from "../services/todoist-sync-service.js";

export interface TodoDailyCompletionControllerHost
  extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class TodoDailyCompletionController implements ReactiveController {
  private host: TodoDailyCompletionControllerHost;
  private todoistSyncService: TodoistSyncService | null = null;

  // 状態
  public dailyCompletionStats: DailyCompletionStat[] = [];
  public todayTodoStat: TodayTodoStat | null = null;
  public loading = false;
  public error = "";

  constructor(host: TodoDailyCompletionControllerHost) {
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
  public initializeService(token: string) {
    this.todoistSyncService = new TodoistSyncService(token);
    this.fetchDailyCompletionStats();
    this.fetchTodayTodoStats();
  }

  // サービスのクリア
  public clearService() {
    this.todoistSyncService = null;
    this.dailyCompletionStats = [];
    this.todayTodoStat = null;
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // 日別完了統計の取得
  public async fetchDailyCompletionStats(days: number = 30) {
    if (!this.todoistSyncService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      this.dailyCompletionStats =
        await this.todoistSyncService.getDailyCompletionStats(days);
    } catch {
      this.error = "@taskタスクの完了統計の取得に失敗しました";
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // 当日統計の取得
  public async fetchTodayTodoStats() {
    if (!this.todoistSyncService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      this.todayTodoStat = await this.todoistSyncService.getTodayTodoStats();
    } catch {
      this.error = "当日の@taskタスク統計の取得に失敗しました";
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // 統計データの再取得
  public async refreshStats() {
    await this.fetchDailyCompletionStats();
    await this.fetchTodayTodoStats();
  }

  // 最大完了数を取得（グラフの表示範囲調整用）
  public getMaxCompletionCount(): number {
    const historicalMax = Math.max(
      ...this.dailyCompletionStats.map((stat) => stat.count),
      1
    );
    const todayCount = this.todayTodoStat?.completedCount || 0;
    return Math.max(historicalMax, todayCount);
  }

  // 過去N日間の合計完了数を取得（当日を含む）
  public getTotalCompletionCount(): number {
    const historicalTotal = this.dailyCompletionStats.reduce(
      (sum, stat) => sum + stat.count,
      0
    );
    const todayCount = this.todayTodoStat?.completedCount || 0;
    return historicalTotal + todayCount;
  }

  // 過去N日間の平均完了数を取得（当日を含む）
  public getAverageCompletionCount(): number {
    const totalDays =
      this.dailyCompletionStats.length + (this.todayTodoStat ? 1 : 0);
    if (totalDays === 0) return 0;
    return this.getTotalCompletionCount() / totalDays;
  }

  // 最新の完了数を取得（当日がある場合は当日を返す）
  public getLatestCompletionCount(): number {
    if (this.todayTodoStat) {
      return this.todayTodoStat.completedCount;
    }
    if (this.dailyCompletionStats.length === 0) return 0;
    return this.dailyCompletionStats[this.dailyCompletionStats.length - 1]
      .count;
  }

  // 当日の完了数を取得
  public getTodayCompletionCount(): number {
    return this.todayTodoStat?.completedCount || 0;
  }
}
