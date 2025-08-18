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
      this.error = "作業完了統計の取得に失敗しました";
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
      this.error = "当日の作業統計の取得に失敗しました";
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

  // 過去7日間の合計完了数を取得（当日を含む）
  public getLast7DaysTotalCount(): number {
    const last7DaysStats = this.dailyCompletionStats.slice(-6); // 過去6日分
    const historicalTotal = last7DaysStats.reduce(
      (sum, stat) => sum + stat.count,
      0
    );
    const todayCount = this.todayTodoStat?.completedCount || 0;
    return historicalTotal + todayCount;
  }

  // 過去7日間の平均完了数を取得（当日を含む）
  public getLast7DaysAverageCount(): number {
    const last7DaysStats = this.dailyCompletionStats.slice(-6); // 過去6日分
    const totalDays = last7DaysStats.length + (this.todayTodoStat ? 1 : 0);
    if (totalDays === 0) return 0;
    return this.getLast7DaysTotalCount() / totalDays;
  }

  // 統計期間の日数を取得
  public getTotalDays(): number {
    return this.dailyCompletionStats.length + (this.todayTodoStat ? 1 : 0);
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

  // グラフ用の過去7日間平均データを取得（各日付における過去7日間平均）
  public getSevenDayAverageDataForChart(): (number | null)[] {
    // 全データセット（履歴データ + 当日データ）を構築
    const allStats = [...this.dailyCompletionStats];
    
    // 当日データがある場合は追加
    if (this.todayTodoStat) {
      const todayDate = this.todayTodoStat.date;
      const existingTodayIndex = allStats.findIndex(
        (stat) => stat.date === todayDate
      );

      if (existingTodayIndex >= 0) {
        // 既存の当日データを更新
        allStats[existingTodayIndex] = {
          date: todayDate,
          count: this.todayTodoStat.completedCount,
          displayDate: this.todayTodoStat.displayDate,
        };
      } else {
        // 新しい当日データを追加
        allStats.push({
          date: todayDate,
          count: this.todayTodoStat.completedCount,
          displayDate: this.todayTodoStat.displayDate,
        });
      }
    }

    // 各日付における過去7日間平均を計算
    return allStats.map((_, index) => {
      // 最初の6日間はデータ不足のためnullを返す
      if (index < 6) return null;
      
      // 該当日を含む過去7日間のデータを取得
      const sevenDaysData = allStats.slice(index - 6, index + 1);
      const totalCount = sevenDaysData.reduce((sum, stat) => sum + stat.count, 0);
      
      return totalCount / 7;
    });
  }
}
