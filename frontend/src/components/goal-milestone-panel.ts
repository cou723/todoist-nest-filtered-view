import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { GoalMilestoneController } from "../controllers/goal-milestone-controller.js";
import { TodoistService } from "../services/todoist-service.js";
import "./ui/panel.js";

@customElement("goal-milestone-panel")
export class GoalMilestonePanel extends LitElement {
  private goalMilestoneController = new GoalMilestoneController(this);

  public setTodoistService(service: TodoistService) {
    this.goalMilestoneController.initializeService(service);
  }

  public render() {
    return html`
      <ui-panel>
        <div class="goal-milestone-stats">
          <h2>マイルストーン進捗</h2>
          ${this.renderContent()}
        </div>
      </ui-panel>
    `;
  }

  private renderContent() {
    if (this.goalMilestoneController.loading)
      return html`<p class="loading">読み込み中...</p>`;

    if (this.goalMilestoneController.error)
      return html`<p class="error">${this.goalMilestoneController.error}</p>`;

    return this.renderStats();
  }

  private renderStats() {
    const { percentage, goalCount, nonMilestoneCount } =
      this.goalMilestoneController.calculateGoalMilestoneRatio();

    return html`
      <div class="stats-content">
        <div class="percentage">${percentage}%</div>
        <div class="description">@non-milestone タスクの割合</div>
        <div class="details">${nonMilestoneCount} / ${goalCount} タスク</div>
      </div>
    `;
  }

  public static styles = css`
    .goal-milestone-stats {
      text-align: center;
    }

    .goal-milestone-stats h2 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .stats-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .percentage {
      font-size: 2rem;
      font-weight: bold;
      color: var(--primary-color, #007acc);
    }

    .description {
      font-size: 0.9rem;
      color: var(--text-muted, #666);
    }

    .details {
      font-size: 0.8rem;
      color: var(--text-muted, #666);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "goal-milestone-panel": GoalMilestonePanel;
  }
}
