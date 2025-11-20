import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  TodoistSyncService,
  type DailyCompletionStat,
  type TodayTaskStat as TodayTodoStat,
} from "../services/todoist-sync-service.js";
import { TodoistService } from "../services/todoist-service.js";

export interface TodoDailyCompletionControllerHost
  extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class TodoDailyCompletionController implements ReactiveController {
  private host: TodoDailyCompletionControllerHost;
  private todoistSyncService: TodoistSyncService | null = null;
  private todoistService: TodoistService | null = null;
  // 7日移動平均を先頭日から算出するための先読み分（6日）を含む内部データ
  private statsForAverage: DailyCompletionStat[] = [];
  // 表示対象日数（UI要件に応じて 30 または 90）
  private visibleDays = 90;

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
    this.todoistService = new TodoistService(token);
    // 最終要件: UIは3か月分表示（90日）
    this.fetchDailyCompletionStats(90);
    this.fetchTodayTodoStats();
  }

  // サービスのクリア
  public clearService() {
    this.todoistSyncService = null;
    this.todoistService = null;
    this.dailyCompletionStats = [];
    this.statsForAverage = [];
    this.todayTodoStat = null;
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // 日別完了統計の取得
  public async fetchDailyCompletionStats(days: number = 90) {
    if (!this.todoistSyncService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      // 先頭日から7日平均を表示するため、6日分前倒しで取得
      const fetchDays = Math.max(0, days + 6);
      const full = await this.todoistSyncService.getDailyCompletionStats(fetchDays);
      this.visibleDays = days;
      this.statsForAverage = full; // 先頭6日 + 表示対象日数
      // 表示分は直近days日に制限（今日分は別APIで補完）
      this.dailyCompletionStats = full.slice(-days);
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
    await this.fetchDailyCompletionStats(this.visibleDays);
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

  // 現在の表示対象日数を取得
  public getVisibleDays(): number {
    return this.visibleDays;
  }

  // 残り@task数を取得
  public async getRemainingTaskCount(): Promise<number> {
    if (!this.todoistService) return 0;

    try {
      const tasks = await this.todoistService.fetchTodosByFilter("@task");
      // 未完了のもののみカウント
      return tasks.filter(task => !task.isCompleted).length;
    } catch (error) {
      console.error("残り@task数の取得に失敗:", error);
      return 0;
    }
  }

  // グラフ用の過去7日間平均データを取得（各日付における過去7日間平均）
  public getSevenDayAverageDataForChart(): number[] {
    // 表示用（直近visibleDays分 + 当日）
    const visible = [...this.dailyCompletionStats];
    const hasToday = Boolean(this.todayTodoStat);
    if (hasToday && this.todayTodoStat) {
      visible.push({
        date: this.todayTodoStat.date,
        count: this.todayTodoStat.completedCount,
        displayDate: this.todayTodoStat.displayDate,
      });
    }

    // 先読み分（先頭6日）を含むバックデータ
    const base = [...this.statsForAverage]; // 長さ: visibleDays + 6（きょう除く）

    const averages: number[] = [];
    const visibleDaysCount = this.dailyCompletionStats.length; // きょう除く

    // 可視領域（きょうを除く）: i = 0 .. visibleDaysCount-1
    for (let i = 0; i < visibleDaysCount; i++) {
      const window = base.slice(i, i + 7); // 先頭6日を含む7件を想定
      const sum = window.reduce((s, st) => s + (st?.count ?? 0), 0);
      const denom = window.length || 1; // データ不足時の安全策
      averages.push(sum / denom);
    }

    // 当日分
    if (hasToday && this.todayTodoStat) {
      const last6 = base.slice(-6);
      const sum6 = last6.reduce((s, st) => s + (st?.count ?? 0), 0);
      const sum7 = sum6 + this.todayTodoStat.completedCount;
      const denom = last6.length + 1; // 6 + 当日
      averages.push(sum7 / denom);
    }

    return averages;
  }
}
