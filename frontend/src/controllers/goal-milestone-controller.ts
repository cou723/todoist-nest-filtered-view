import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Task } from "@doist/todoist-api-typescript";
import { TodoistService } from "../services/todoist-service.js";

export interface GoalMilestoneControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class GoalMilestoneController implements ReactiveController {
  private host: GoalMilestoneControllerHost;
  private todoistService: TodoistService | null = null;

  // 状態
  public goalTasks: Task[] = [];
  public loading = false;
  public error = "";

  constructor(host: GoalMilestoneControllerHost) {
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
    this.fetchGoalTasks();
  }

  // サービスのクリア
  public clearService() {
    this.todoistService = null;
    this.goalTasks = [];
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // ゴールタスクの取得
  public async fetchGoalTasks() {
    if (!this.todoistService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      const tasks = await this.todoistService.fetchTasksByFilter("@goal");
      this.goalTasks = tasks;
    } catch (err) {
      this.error = "ゴールタスクの取得に失敗しました";
      console.error("Failed to fetch goal tasks:", err);
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // ゴールマイルストーン比率の計算
  public calculateGoalMilestoneRatio(): { percentage: number; goalCount: number; nonMilestoneCount: number } {
    const nonMilestoneTasks = this.goalTasks.filter(task =>
      task.labels.includes("non-milestone")
    );

    const goalCount = this.goalTasks.length;
    const nonMilestoneCount = nonMilestoneTasks.length;
    const percentage = goalCount > 0 ? Math.round((nonMilestoneCount / goalCount) * 100) : 0;

    return { percentage, goalCount, nonMilestoneCount };
  }
}