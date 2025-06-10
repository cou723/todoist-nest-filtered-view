import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { when } from "../utils/template-utils.js";

/**
 * ゴール統計ダッシュボードコンポーネント
 * goalタグを持つタスクのうちnon-milestoneタグを持つタスクの割合を表示する
 */
@customElement("goal-stats-pane")
export class GoalStatsPaneElement extends LitElement {
  @property({ type: Number })
  public percentage = 0;

  @property({ type: Boolean })
  public loading = false;

  @property({ type: Boolean })
  public hasData = false;

  @property({ type: String })
  public error = "";

  public render() {
    return html`
      <div class="stats-container">
        <h2>ゴール進捗状況</h2>

        ${when(
          this.loading,
          () => html`<div class="loading">データ読み込み中...</div>`,
          () =>
            when(
              this.error,
              () => html`<div class="error">${this.error}</div>`,
              () =>
                when(
                  this.hasData,
                  () => html`
                    <div class="stats-content">
                      <div class="percentage-display">
                        <span class="percentage-value"
                          >${this.percentage}%</span
                        >
                        <span class="percentage-label">達成</span>
                      </div>
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          style="width: ${this.percentage}%"
                        ></div>
                      </div>
                      <div class="stats-description">
                        <p>
                          goalタグを持つタスクのうち、non-milestoneタグを持つタスクの割合
                        </p>
                      </div>
                    </div>
                  `,
                  () =>
                    html`<div class="no-data">表示するデータがありません</div>`
                )
            )
        )}
      </div>
    `;
  }

  public static styles = css`
    :host {
      display: block;
      margin-bottom: 1rem;
    }

    .stats-container {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px var(--card-shadow);
    }

    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      color: var(--text-color);
      text-align: left;
    }

    .stats-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .percentage-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .percentage-value {
      font-size: 2rem;
      font-weight: bold;
      color: var(--primary-color);
    }

    .percentage-label {
      font-size: 0.9rem;
      color: var(--text-color-light);
    }

    .progress-bar {
      width: 100%;
      height: 0.5rem;
      background-color: var(--bg-color-secondary);
      border-radius: 0.25rem;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--primary-color);
      transition: width 0.3s ease;
    }

    .stats-description {
      font-size: 0.8rem;
      color: var(--text-color-light);
      text-align: center;
      margin-top: 0.5rem;
    }

    .loading,
    .error,
    .no-data {
      padding: 1rem;
      text-align: center;
      color: var(--text-color-light);
    }

    .error {
      color: var(--error-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "goal-stats-pane": GoalStatsPaneElement;
  }
}
