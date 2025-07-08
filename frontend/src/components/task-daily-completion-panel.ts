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
          ${this.renderLineChart(stats, maxCount)}
        </div>
      </div>
    `;
  }

  private renderLineChart(stats: Array<{ date: string; count: number; displayDate: string }>, maxCount: number) {
    if (stats.length === 0) return html``;

    const chartWidth = 100; // SVG viewport percentage
    const chartHeight = 100; // SVG viewport percentage
    const padding = 10; // パディング（%）

    // データポイントを計算
    const points = stats.map((stat, index) => {
      const x = padding + (index / (stats.length - 1)) * (chartWidth - 2 * padding);
      const y = maxCount > 0 
        ? chartHeight - padding - ((stat.count / maxCount) * (chartHeight - 2 * padding))
        : chartHeight - padding;
      return { x, y, count: stat.count, displayDate: stat.displayDate };
    });

    // SVGパスを生成
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return html`
      <div class="line-chart">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="chart-svg">
          <!-- グリッドライン -->
          ${this.renderGridLines(chartWidth, chartHeight, padding, maxCount)}
          
          <!-- 折れ線 -->
          <path d="${pathData}" class="line-path" fill="none" stroke="var(--primary-color)" stroke-width="2"/>
          
          <!-- データポイント -->
          ${points.map(point => html`
            <circle 
              cx="${point.x}" 
              cy="${point.y}" 
              r="3" 
              class="data-point"
              fill="var(--primary-color)"
            >
              <title>${point.displayDate}: ${point.count}件</title>
            </circle>
          `)}
        </svg>
        
        <!-- X軸ラベル -->
        <div class="x-axis-labels">
          ${stats.map((stat, index) => {
            const shouldShow = index % Math.ceil(stats.length / 7) === 0 || index === stats.length - 1;
            return shouldShow ? html`
              <div class="x-label" style="left: ${padding + (index / (stats.length - 1)) * (chartWidth - 2 * padding)}%">
                ${stat.displayDate}
              </div>
            ` : '';
          })}
        </div>
      </div>
    `;
  }

  private renderGridLines(chartWidth: number, chartHeight: number, padding: number, maxCount: number) {
    const gridLines = [];
    const steps = Math.min(5, maxCount + 1); // 最大5本のグリッド線
    
    for (let i = 0; i <= steps; i++) {
      const y = chartHeight - padding - (i / steps) * (chartHeight - 2 * padding);
      const value = Math.round((i / steps) * maxCount);
      
      gridLines.push(html`
        <line 
          x1="${padding}" 
          y1="${y}" 
          x2="${chartWidth - padding}" 
          y2="${y}" 
          class="grid-line"
          stroke="var(--border-color)" 
          stroke-width="0.5"
          opacity="0.5"
        />
        <text 
          x="${padding - 2}" 
          y="${y + 1}" 
          class="y-label"
          fill="var(--text-muted)"
          font-size="3"
          text-anchor="end"
          dominant-baseline="middle"
        >${value}</text>
      `);
    }
    
    return gridLines;
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
      position: relative;
    }

    .line-chart {
      position: relative;
      width: 100%;
      height: 150px;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .line-path {
      transition: stroke-width 0.2s ease;
    }

    .line-path:hover {
      stroke-width: 3;
    }

    .data-point {
      transition: r 0.2s ease;
      cursor: pointer;
    }

    .data-point:hover {
      r: 4;
      filter: drop-shadow(0 0 3px var(--primary-color));
    }

    .grid-line {
      opacity: 0.3;
    }

    .y-label {
      font-family: inherit;
      font-size: 10px;
    }

    .x-axis-labels {
      position: absolute;
      bottom: -25px;
      left: 0;
      right: 0;
      height: 20px;
    }

    .x-label {
      position: absolute;
      font-size: 0.7rem;
      color: var(--text-muted);
      transform: translateX(-50%);
      text-align: center;
      line-height: 1.2;
      white-space: nowrap;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-daily-completion-panel": TaskDailyCompletionPanel;
  }
}