import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { formatDueDate, getDueDateUrgency } from "../../../utils/task-utils.js";
import { when } from "../../../utils/template-utils.js";

@customElement("task-meta-due-date")
export class TaskMetaDueDate extends LitElement {
  @property({ type: Object })
  due?: { date: string; datetime?: string };

  render() {
    return when(
      this.due,
      html`<span class="due-date due-${getDueDateUrgency(this.due!)}">
        📅 ${formatDueDate(this.due!)}
      </span>`
    );
  }

  static styles = css`
    .due-date {
      margin-right: 0.5em;
      font-weight: 500;
      font-size: 0.9em;
    }

    /* 期限の緊急度に応じた色分け */
    .due-overdue {
      color: #dc3545; /* 期限切れ - 赤 */
      font-weight: bold;
    }

    .due-today {
      color: #fd7e14; /* 今日 - オレンジ */
      font-weight: bold;
    }

    .due-tomorrow {
      color: #ffc107; /* 明日 - 黄 */
    }

    .due-soon {
      color: #17a2b8; /* 近日中 - 青 */
    }

    .due-normal {
      color: var(--text-secondary); /* 通常 - グレー */
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-meta-due-date": TaskMetaDueDate;
  }
}
