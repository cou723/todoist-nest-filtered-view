import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("task-content")
export class TaskContent extends LitElement {
  @property({ type: String })
  public content!: string;

  @property({ type: String })
  public taskId!: string;

  public render() {
    return html`
      <div class="task-content">
        <a
          href="https://todoist.com/showTask?id=${this.taskId}"
          target="_blank"
          rel="noopener noreferrer"
          class="task-link"
        >
          ${this.content}
        </a>
      </div>
    `;
  }

  public static styles = css`
    .task-content {
      font-weight: bold;
      margin-bottom: 0.2em;
      color: var(--text-color);
      flex: 1;
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-content": TaskContent;
  }
}
