import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("todo-content")
export class TodoContent extends LitElement {
  @property({ type: String })
  public content!: string;

  @property({ type: String })
  public todoId!: string;

  public render() {
    return html`
      <div class="todo-content">
        <a
          href="https://todoist.com/showTask?id=${this.todoId}"
          target="_blank"
          rel="noopener noreferrer"
          class="todo-link"
        >
          ${this.content}
        </a>
      </div>
    `;
  }

  public static styles = css`
    .todo-content {
      font-weight: bold;
      margin-bottom: 0.2em;
      color: var(--text-color);
      flex: 1;
    }

    .todo-link {
      color: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .todo-link:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .todo-link:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 2px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "todo-content": TodoContent;
  }
}
