import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TaskWithParent } from "../../types/task.js";
import "./checkbox.js";
import "./parent-display.js";
import "./meta";
import "./content.js";

@customElement("task-item")
export class TaskItem extends LitElement {
  @property({ type: Object })
  public task!: TaskWithParent;

  @property({ attribute: false })
  public onCompleteTask?: (taskId: string) => void;

  public render() {
    return html`
      <li class="task-item">
        <div class="task-left">
          <parent-task-display
            .grandparentTask=${this.task.grandparentTask}
            .parentTask=${this.task.parentTask}
          ></parent-task-display>

          <div class="task-main">
            <task-content
              .content=${this.task.content}
              .taskId=${this.task.id}
            ></task-content>

            <task-meta
              .priority=${this.task.priority}
              .due=${this.task.due ?? undefined}
              .labels=${this.task.labels}
            ></task-meta>
          </div>
        </div>

        <div class="task-actions">
          <task-checkbox
            .taskId=${this.task.id}
            .onComplete=${this.onCompleteTask}
            checkboxTitle="タスクを完了にする"
          ></task-checkbox>
        </div>
      </li>
    `;
  }

  public static styles = css`
    .task-item {
      padding: 0.4em 0;
      border-bottom: 1px solid var(--border-color);
      transition: border-color 0.3s ease;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 1em;
    }

    .task-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2em;
    }

    .task-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1em;
    }

    .task-actions {
      display: flex;
      align-items: center;
      width: 60px;
      flex-shrink: 0;
      justify-content: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-item": TaskItem;
  }
}
