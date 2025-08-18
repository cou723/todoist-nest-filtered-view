import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { Task as Todo } from "@doist/todoist-api-typescript";
import { TodoistService } from "../services/todoist-service.js";

export interface GoalMilestoneControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class GoalMilestoneController implements ReactiveController {
  private host: GoalMilestoneControllerHost;
  private todoistService: TodoistService | null = null;

  // 状態
  public goalTodos: Todo[] = [];
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
    this.fetchGoalTodos();
  }

  // サービスのクリア
  public clearService() {
    this.todoistService = null;
    this.goalTodos = [];
    this.error = "";
    this.loading = false;
    this.host.requestUpdate();
  }

  // ゴールタスクの取得
  public async fetchGoalTodos() {
    if (!this.todoistService) return;

    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      const todos = await this.todoistService.fetchTodosByFilter("@goal");
      this.goalTodos = todos;
    } catch (err) {
      this.error = `ゴールタスクの取得に失敗しました: ${err}`;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // ゴールマイルストーン比率の計算
  public calculateGoalMilestoneRatio(): {
    percentage: number;
    goalCount: number;
    nonMilestoneCount: number;
  } {
    const nonMilestoneTodos = this.goalTodos.filter((t) =>
      t.labels.includes("non-milestone")
    );

    const goalCount = this.goalTodos.length;
    const nonMilestoneCount = nonMilestoneTodos.length;
    const percentage =
      goalCount > 0 ? Math.round((nonMilestoneCount / goalCount) * 100) : 0;

    return { percentage, goalCount, nonMilestoneCount };
  }
}
