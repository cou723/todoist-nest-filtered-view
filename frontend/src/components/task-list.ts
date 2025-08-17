import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { TodoNode } from "../types/task.js";
import { layoutStyles } from "../styles/common.js";
import { sortTodosByPriority as sortTodosByPriority } from "../utils/task-utils.js";
import "./task/index.js";

@customElement("todo-list")
export class TodoList extends LitElement {
  @property({ type: Array })
  private todos: TodoNode[] = [];

  @property({ type: Boolean })
  private loading = false;

  @property({ type: String })
  private error = "";

  @property({ attribute: false })
  private onCompleteTodo?: (todoId: string) => void;

  public render() {
    if (this.loading) {
      return html`<p class="loading">読み込み中...</p>`;
    }

    if (this.error) {
      return html`<p class="error">${this.error}</p>`;
    }

    if (this.todos.length === 0) {
      return html`<p class="no-todos">タスクがありません</p>`;
    }

    const sortedTodos = sortTodosByPriority(this.todos);

    return html`
      <ul class="todo-list">
        ${repeat(
          sortedTodos,
          (t) => t.id,
          (t) => html`
            <todo-item
              .todo=${t}
              .onCompleteTodo=${this.onCompleteTodo}
            ></todo-item>
          `
        )}
      </ul>
    `;
  }

  public static styles = [
    layoutStyles,
    css`
      .todo-list {
        text-align: left;
        margin: 0 auto;
        padding: 0;
        list-style: none;
      }

      .loading,
      .no-todos {
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
    "todo-list": TodoList;
  }
}
