import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  TodoistSyncService,
  type DailyCompletionStat,
} from "../services/todoist-sync-service.js";

export interface TaskDailyCompletionControllerHost
  extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class TaskDailyCompletionController implements ReactiveController {
  private host: TaskDailyCompletionControllerHost;
  private todoistSyncService: TodoistSyncService | null = null;

  // 状態
  public dailyCompletionStats: DailyCompletionStat[] = [];
  public loading = false;
  public error = "";

  constructor(host: TaskDailyCompletionControllerHost) {
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
  }

  // サービスのクリア
  public clearService() {
    this.todoistSyncService = null;
    this.dailyCompletionStats = [];
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
    } catch (e) {
      console.error("Error fetching daily completion stats:", e);

      this.error = "@taskタスクの完了統計の取得に失敗しました";
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // 統計データの再取得
  public async refreshStats() {
    await this.fetchDailyCompletionStats();
  }

  // 最大完了数を取得（グラフの表示範囲調整用）
  public getMaxCompletionCount(): number {
    return Math.max(...this.dailyCompletionStats.map((stat) => stat.count), 1);
  }

  // 過去N日間の合計完了数を取得
  public getTotalCompletionCount(): number {
    return this.dailyCompletionStats.reduce((sum, stat) => sum + stat.count, 0);
  }

  // 過去N日間の平均完了数を取得
  public getAverageCompletionCount(): number {
    if (this.dailyCompletionStats.length === 0) return 0;
    return this.getTotalCompletionCount() / this.dailyCompletionStats.length;
  }

  // 最新の完了数を取得
  public getLatestCompletionCount(): number {
    if (this.dailyCompletionStats.length === 0) return 0;
    return this.dailyCompletionStats[this.dailyCompletionStats.length - 1]
      .count;
  }
}
