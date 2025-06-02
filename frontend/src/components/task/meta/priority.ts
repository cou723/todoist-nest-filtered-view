import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getPriorityText } from "../../../utils/task-utils.js";

@customElement("task-meta-priority")
export class TaskMetaPriority extends LitElement {
  @property({ type: Number })
  priority!: number;

  render() {
    return html`
      <span class="priority priority-${this.priority}">
        ${getPriorityText(this.priority)}
      </span>
    `;
  }

  static styles = css`
    .priority {
      margin-bottom: 0.1em;
      font-weight: 500;
    }

    /* 優先順位に応じた色分け */
    .priority-4 {
      color: #dc3545; /* 緊急/重要 - 赤 */
    }

    .priority-3 {
      color: #fd7e14; /* 不急/重要 - オレンジ */
    }

    .priority-2 {
      color: #ffc107; /* 緊急/些末 - 黄 */
    }

    .priority-1 {
      color: var(--text-secondary); /* 不急/些末 - グレー */
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-meta-priority": TaskMetaPriority;
  }
}
