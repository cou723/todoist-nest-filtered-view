import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { ref, createRef, type Ref } from "lit/directives/ref.js";
import { Chart, type ChartConfiguration, registerables } from "chart.js";
import { TodoDailyCompletionController as TodoDailyCompletionController } from "../controllers/task-daily-completion-controller.js";
import "./ui/panel.js";
import "./ui/button.js";

// Chart.jsのコンポーネントを登録
Chart.register(...registerables);

@customElement("todo-daily-completion-panel")
export class TodoDailyCompletionPanel extends LitElement {
  private completionController = new TodoDailyCompletionController(this);
  private chartInstance: Chart | null = null;
  private canvasRef: Ref<HTMLCanvasElement> = createRef();
  private remainingTaskCount = 0;

  public setToken(token: string) {
    this.completionController.initializeService(token);
    this.fetchRemainingTaskCount();
  }

  public clearToken() {
    // チャートを破棄
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    this.remainingTaskCount = 0;
    this.completionController.clearService();
  }

  public render() {
    return html`
      <ui-panel>
        <div class="completion-content">
          <div class="header">
            <h2>作業完了統計</h2>
            <ui-button
              class="refresh-button"
              variant="secondary"
              ?disabled=${this.completionController.loading}
              @click=${this.onRefreshClick}
              title="Todoistから最新の統計データを再取得"
            >
              データを取得しなおす
            </ui-button>
          </div>
          ${this.renderContent()}
        </div>
      </ui-panel>
    `;
  }

  protected updated() {
    // DOM更新後にチャートを更新
    const stats = this.completionController.dailyCompletionStats;
    const todayStats = this.completionController.todayTodoStat;

    if (stats.length > 0 || todayStats) {
      // 次のフレームでチャートを更新（DOM要素が確実に存在することを保証）
      requestAnimationFrame(() => {
        this.updateChart(stats, todayStats);
      });
    }
  }

  private renderContent() {
    if (this.completionController.loading)
      return html`<p class="loading">読み込み中...</p>`;

    if (this.completionController.error)
      return html`<p class="error">${this.completionController.error}</p>`;

    if (
      this.completionController.dailyCompletionStats.length === 0 &&
      !this.completionController.todayTodoStat
    )
      return html`<p class="empty">完了統計データがありません</p>`;

    return this.renderStats();
  }

  private renderStats() {
    const visibleDays = this.completionController.getVisibleDays();
    const totalCount = this.completionController.getTotalCompletionCount();

    return html`
      <div class="stats-container">
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">過去${visibleDays}日間合計</div>
            <div class="stat-value">${totalCount}件</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">残り@task数</div>
            <div class="stat-value">${this.remainingTaskCount}件</div>
          </div>
        </div>

        <div class="chart-container">
          <canvas ${ref(this.canvasRef)}></canvas>
        </div>
      </div>
    `;
  }

  private async onRefreshClick() {
    // 統計データを再取得。完了後に残り@task数も更新
    await this.completionController.refreshStats();
    await this.fetchRemainingTaskCount();
  }

  private async fetchRemainingTaskCount() {
    try {
      this.remainingTaskCount = await this.completionController.getRemainingTaskCount();
      this.requestUpdate();
    } catch (error) {
      console.error("残り@task数の取得に失敗:", error);
      this.remainingTaskCount = 0;
      this.requestUpdate();
    }
  }

  private updateChart(
    stats: Array<{ date: string; count: number; displayDate: string }>,
    todayStats?: {
      date: string;
      completedCount: number;
      displayDate: string;
    } | null
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
    if (stats.length === 0 && !todayStats) {
      return;
    }

    // 完全なデータセットを作成（履歴データ + 当日データ）
    const allStats = [...stats];

    // 当日データがある場合は追加
    if (todayStats) {
      // 既存の履歴データに当日が含まれているかチェック
      const todayDate = todayStats.date;
      const existingTodayIndex = allStats.findIndex(
        (stat) => stat.date === todayDate
      );

      if (existingTodayIndex >= 0) {
        // 既存の当日データを更新
        allStats[existingTodayIndex] = {
          date: todayDate,
          count: todayStats.completedCount,
          displayDate: todayStats.displayDate,
        };
      } else {
        // 新しい当日データを追加
        allStats.push({
          date: todayDate,
          count: todayStats.completedCount,
          displayDate: todayStats.displayDate,
        });
      }
    }

    // 過去7日間平均データを取得
    const sevenDayAverageData = this.completionController.getSevenDayAverageDataForChart();

    // CSS変数から色を取得
    const computedStyle = getComputedStyle(this);
    const borderColor = computedStyle.getPropertyValue("--border-color").trim();
    const secondaryColor =
      computedStyle.getPropertyValue("--secondary-color").trim() || "#ff6b35"; // セカンダリカラーがない場合はオレンジをデフォルト

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: allStats.map((stat) => stat.displayDate),
        datasets: [
          {
            label: "過去7日間平均",
            data: sevenDayAverageData,
            borderColor: secondaryColor,
            backgroundColor: secondaryColor + "20",
            tension: 0.1,
            fill: false,
            pointBackgroundColor: secondaryColor,
            pointBorderColor: secondaryColor,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderDash: [5, 5], // 破線スタイル
            spanGaps: false, // nullがある部分は線を引かない
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
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

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .completion-content h2 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .refresh-button {
      margin-left: auto;
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
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.8rem;
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
    "todo-daily-completion-panel": TodoDailyCompletionPanel;
  }
}
