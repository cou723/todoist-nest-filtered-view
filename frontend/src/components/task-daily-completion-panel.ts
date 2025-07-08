import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { TaskDailyCompletionController } from "../controllers/task-daily-completion-controller.js";
import "./ui/panel.js";

@customElement("task-daily-completion-panel")
export class TaskDailyCompletionPanel extends LitElement {
  private completionController = new TaskDailyCompletionController(this);

  public setToken(token: string) {
    this.completionController.initializeService(token);
  }

  public clearToken() {
    this.completionController.clearService();
  }

  public render() {
    return html`
      <ui-panel>
        <div class="completion-content">
          <h2>@taskタスク完了統計</h2>
          ${this.renderContent()}
        </div>
      </ui-panel>
    `;
  }

  private renderContent() {
    if (this.completionController.loading)
      return html`<p class="loading">読み込み中...</p>`;

    if (this.completionController.error)
      return html`<p class="error">${this.completionController.error}</p>`;

    if (this.completionController.dailyCompletionStats.length === 0)
      return html`<p class="empty">完了統計データがありません</p>`;

    return this.renderStats();
  }

  private renderStats() {
    const stats = this.completionController.dailyCompletionStats;
    const maxCount = this.completionController.getMaxCompletionCount();
    const totalCount = this.completionController.getTotalCompletionCount();
    const avgCount = this.completionController.getAverageCompletionCount();

    return html`
      <div class="stats-container">
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">合計</div>
            <div class="stat-value">${totalCount}件</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均</div>
            <div class="stat-value">${avgCount.toFixed(1)}件/日</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最大</div>
            <div class="stat-value">${maxCount}件</div>
          </div>
        </div>
        
        <div class="chart-container">
          <div class="chart">
            ${stats.map(stat => this.renderBar(stat, maxCount))}
          </div>
        </div>
      </div>
    `;
  }

  private renderBar(stat: { date: string; count: number; displayDate: string }, maxCount: number) {
    const height = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
    
    return html`
      <div class="bar-container">
        <div class="bar-wrapper">
          <div class="bar" style="height: ${height}%">
            <div class="bar-value ${stat.count > 0 ? 'has-value' : ''}">${stat.count}</div>
          </div>
        </div>
        <div class="bar-label">${stat.displayDate}</div>
      </div>
    `;
  }

  public static styles = css`
    .completion-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .completion-content h2 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .loading,
    .error,
    .empty {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
      padding: 1rem;
    }

    .error {
      color: var(--error-color);
    }

    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .stat-item {
      text-align: center;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background: var(--surface-color);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--text-color);
    }

    .chart-container {
      min-height: 200px;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background: var(--surface-color);
    }

    .chart {
      display: flex;
      align-items: end;
      gap: 2px;
      height: 150px;
      overflow-x: auto;
      padding-bottom: 1rem;
    }

    .bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 40px;
      height: 100%;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      align-items: end;
      width: 100%;
      position: relative;
    }

    .bar {
      width: 100%;
      background: var(--primary-color);
      border-radius: 2px 2px 0 0;
      min-height: 4px;
      position: relative;
      transition: background-color 0.2s ease;
    }

    .bar:hover {
      background: var(--primary-hover-color);
    }

    .bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7rem;
      font-weight: bold;
      color: var(--text-color);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .bar-value.has-value {
      opacity: 1;
    }

    .bar:hover .bar-value {
      opacity: 1;
    }

    .bar-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      text-align: center;
      line-height: 1.2;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-daily-completion-panel": TaskDailyCompletionPanel;
  }
}