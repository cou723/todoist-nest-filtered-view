import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { when } from "../../utils/template-utils.js";

@customElement("parent-task-display")
export class ParentTaskDisplay extends LitElement {
  @property({ type: String })
  parentTaskName?: string;

  @property({ type: String })
  parentTaskId?: string;

  @property({ type: String })
  grandparentTaskName?: string;

  @property({ type: String })
  grandparentTaskId?: string;

  private openTaskInTodoist(taskId: string): void {
    window.open(
      `https://todoist.com/showTask?id=${taskId}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  private get parentTaskDisplay(): string {
    if (!this.parentTaskName) {
      return "";
    }

    if (this.grandparentTaskName) {
      return `${this.grandparentTaskName} > ${this.parentTaskName}`;
    }

    return this.parentTaskName;
  }

  render() {
    return when(
      this.parentTaskDisplay,
      html`<div class="parent-task">
        ${this.grandparentTaskName
          ? html`
              <span
                class="parent-task-link"
                @click=${() => {
                  this.openTaskInTodoist(this.grandparentTaskId!);
                }}
              >
                ${this.grandparentTaskName}
              </span>
              <span class="separator"> > </span>
            `
          : ""}
        <span
          class="parent-task-link"
          @click=${() => {
            this.openTaskInTodoist(this.parentTaskId!);
          }}
        >
          ${this.parentTaskName}
        </span>
      </div>`
    );
  }

  static styles = css`
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
