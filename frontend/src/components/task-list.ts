import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TaskWithParent } from "../types/task.js";
import { layoutStyles } from "../styles/common.js";
import { sortTasksByPriority } from "../utils/task-utils.js";
import "./task/index.js";

@customElement("task-list")
export class TaskList extends LitElement {
  @property({ type: Array })
  private tasks: TaskWithParent[] = [];

  @property({ type: Boolean })
  private loading = false;

  @property({ type: String })
  private error = "";

  @property({ type: Function })
  private onCompleteTask?: (taskId: string) => void;

  public render() {
    if (this.loading) {
      return html`<p class="loading">読み込み中...</p>`;
    }

    if (this.error) {
      return html`<p class="error">${this.error}</p>`;
    }

    if (this.tasks.length === 0) {
      return html`<p class="no-tasks">タスクがありません</p>`;
    }

    const sortedTasks = sortTasksByPriority(this.tasks);

    return html`
      <ul class="task-list">
        ${sortedTasks.map(
          (task) =>
            html`<task-item
              .task=${task}
              .onCompleteTask=${this.onCompleteTask}
            ></task-item>`
        )}
      </ul>
    `;
  }

  public static styles = [
    layoutStyles,
    css`
      .task-list {
        text-align: left;
        margin: 0 auto;
        padding: 0;
        list-style: none;
      }

      .loading,
      .no-tasks {
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
      }

      .error {
        text-align: center;
        color: #e44332;
        font-weight: bold;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "task-list": TaskList;
  }
}
