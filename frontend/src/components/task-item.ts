import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TaskWithParent } from "../types/task.js";
import { getPriorityText } from "../utils/task-utils.js";

@customElement("task-item")
export class TaskItem extends LitElement {
  @property({ type: Object })
  task!: TaskWithParent;

  render() {
    const parentTaskDisplay = this.getParentTaskDisplay();

    return html`
      <li class="task-item">
        ${parentTaskDisplay
          ? html`<div class="parent-task">${parentTaskDisplay}</div>`
          : ""}
        <div class="task-content">
          <a
            href="https://todoist.com/showTask?id=${this.task.id}"
            target="_blank"
            rel="noopener noreferrer"
            class="task-link"
          >
            ${this.task.content}
          </a>
        </div>
        <div class="task-meta">
          <span class="priority priority-${this.task.priority}">
            ${getPriorityText(this.task.priority)}
          </span>
          ${this.task.labels && this.task.labels.length > 0
            ? html`<span class="labels"
                >${this.task.labels.map((s) => "@" + s).join(" ")}</span
              >`
            : ""}
        </div>
      </li>
    `;
  }

  private getParentTaskDisplay(): string {
    if (!this.task.parentTaskName) {
      return "";
    }

    if (this.task.grandparentTaskName) {
      return `${this.task.grandparentTaskName} > ${this.task.parentTaskName}`;
    }

    return this.task.parentTaskName;
  }

  static styles = css`
    .task-item {
      padding: 1em 0;
      border-bottom: 1px solid var(--border-color);
      transition: border-color 0.3s ease;
    }

    .task-content {
      font-weight: bold;
      margin-bottom: 0.5em;
      color: var(--text-color);
    }

    .task-link {
      color: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .task-link:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .task-link:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 2px;
    }

    .parent-task {
      font-size: 0.9em;
      color: var(--text-secondary);
      font-style: italic;
      margin-bottom: 0.5em;
    }

    .task-meta {
      margin-top: 0.5em;
      padding-left: 1em;
      font-size: 0.85em;
      color: var(--text-secondary);
    }

    .priority {
      margin-bottom: 0.25em;
      font-weight: 500;
    }

    /* 優先順位に応じた色分け */
    .priority-1 {
      color: #dc3545; /* 緊急/重要 - 赤 */
    }

    .priority-2 {
      color: #fd7e14; /* 不急/重要 - オレンジ */
    }

    .priority-3 {
      color: #ffc107; /* 緊急/些末 - 黄 */
    }

    .priority-4 {
      color: var(--text-secondary); /* 不急/些末 - グレー */
    }

    .labels {
      color: var(--primary-color);
      font-style: italic;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-item": TaskItem;
  }
}
