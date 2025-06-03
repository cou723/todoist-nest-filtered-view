import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { when } from "../../utils/template-utils.js";

@customElement("parent-task-display")
export class ParentTaskDisplay extends LitElement {
  @property({ type: Object })
  public parentTask?: { id: string; name: string };

  @property({ type: Object })
  public grandparentTask?: { id: string; name: string };

  private openTaskInTodoist(taskId: string): void {
    window.open(
      `https://todoist.com/showTask?id=${taskId}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  private get parentTaskDisplay(): string {
    if (!this.parentTask?.name) {
      return "";
    }

    if (this.grandparentTask) {
      return `${this.grandparentTask.name} > ${this.parentTask.name}`;
    }

    return this.parentTask.name;
  }

  public render() {
    return when(
      this.parentTaskDisplay,
      () => html`<div class="parent-task">
        ${when(
          this.grandparentTask,
          (grandparentTask) => html`
            <span
              class="parent-task-link"
              @click=${() => this.openTaskInTodoist(grandparentTask.id)}
            >
              ${grandparentTask.name}
            </span>
            <span class="separator"> > </span>
          `
        )}
        ${when(
          this.parentTask,
          (task) => html`<span
            class="parent-task-link"
            @click=${() => this.openTaskInTodoist(task.id)}
          >
            ${task.name}
          </span>`
        )}
      </div>`
    );
  }

  public static styles = css`
    .parent-task {
      font-size: 0.8em;
      color: var(--text-secondary);
      font-style: italic;
      margin-bottom: 0.2em;
    }

    .parent-task-link {
      color: var(--primary-color);
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .parent-task-link:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .separator {
      color: var(--text-secondary);
      margin: 0 0.2em;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "parent-task-display": ParentTaskDisplay;
  }
}
