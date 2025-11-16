import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TodoNode } from "../../types/task.js";

@customElement("parent-todo-display")
export class ParentTodoDisplay extends LitElement {
  @property({ type: Array })
  public ancestorChain: TodoNode[] = [];

  private openTodoInTodoist(todoId: string): void {
    window.open(
      `https://todoist.com/showTask?id=${todoId}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  public render() {
    if (this.ancestorChain.length === 0) {
      return html``;
    }

    return html`<div class="parent-todo">
      ${this.ancestorChain.map(
        (ancestor, index) => html`
          <span
            class="parent-todo-link"
            @click=${() => this.openTodoInTodoist(ancestor.id)}
          >
            ${ancestor.content}
          </span>
          ${index < this.ancestorChain.length - 1
            ? html`<span class="separator"> > </span>`
            : ""}
        `
      )}
    </div>`;
  }

  public static styles = css`
    .parent-todo {
      font-size: 0.8em;
      color: var(--text-secondary);
      font-style: italic;
      margin-bottom: 0.2em;
    }

    .parent-todo-link {
      color: var(--primary-color);
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .parent-todo-link:hover {
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
    "parent-todo-display": ParentTodoDisplay;
  }
}
