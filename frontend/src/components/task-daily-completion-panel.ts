import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ref, createRef, type Ref } from "lit/directives/ref.js";
import { Chart, type ChartConfiguration, registerables } from "chart.js";
import { TaskDailyCompletionController } from "../controllers/task-daily-completion-controller.js";
import "./ui/panel.js";

// Chart.jsのコンポーネントを登録
Chart.register(...registerables);

@customElement("task-daily-completion-panel")
export class TaskDailyCompletionPanel extends LitElement {
  private completionController = new TaskDailyCompletionController(this);
  private chartInstance: Chart | null = null;
  private canvasRef: Ref<HTMLCanvasElement> = createRef();

  public setToken(token: string) {
    this.completionController.initializeService(token);
  }

  public clearToken() {
    // チャートを破棄
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
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

  protected updated() {
    // DOM更新後にチャートを更新
    const stats = this.completionController.dailyCompletionStats;
    if (stats.length > 0) {
      // 次のフレームでチャートを更新（DOM要素が確実に存在することを保証）
      requestAnimationFrame(() => {
        this.updateChart(stats);
      });
    }
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
    const totalCount = this.completionController.getTotalCompletionCount();
    const avgCount = this.completionController.getAverageCompletionCount();
    const maxCount = this.completionController.getMaxCompletionCount();

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
          <canvas ${ref(this.canvasRef)}></canvas>
        </div>
      </div>
    `;
  }

  private updateChart(
    stats: Array<{ date: string; count: number; displayDate: string }>
  ) {
    if (!this.canvasRef.value) return;

    const canvas = this.canvasRef.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 既存のチャートを破棄
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // データが空の場合はチャートを作成しない
    if (stats.length === 0) {
      return;
    }

    // CSS変数から色を取得
    const computedStyle = getComputedStyle(this);
    const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
    const borderColor = computedStyle.getPropertyValue('--border-color').trim();

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: stats.map((stat) => stat.displayDate),
        datasets: [
          {
            label: "@taskタスク完了数",
            data: stats.map((stat) => stat.count),
            borderColor: primaryColor,
            backgroundColor: primaryColor + "20", // 透明度を追加
            tension: 0.1,
            fill: false,
            pointBackgroundColor: primaryColor,
            pointBorderColor: primaryColor,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return value + "件";
              },
            },
            grid: {
              color: borderColor,
            },
          },
          x: {
            grid: {
              color: borderColor,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    };

    this.chartInstance = new Chart(ctx, config);
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
      height: 200px;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background: var(--surface-color);
      position: relative;
    }

    .chart-container canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-daily-completion-panel": TaskDailyCompletionPanel;
  }
}
