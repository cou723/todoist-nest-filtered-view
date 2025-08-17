import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TodoNode } from "../../types/task.js";
import "./checkbox.js";
import "./parent-display.js";
import "./meta/index.js";
import "./content.js";

@customElement("todo-item")
export class TodoItem extends LitElement {
  @property({ type: Object })
  public todo!: TodoNode;

  @property({ attribute: false })
  public onCompleteTodo?: (todoId: string) => void;

  private buildAncestorChain(todo: TodoNode): TodoNode[] {
    const chain: TodoNode[] = [];
    let current = todo.parent;

    while (current) {
      chain.unshift(current); // 配列の先頭に追加（最も古い祖先から順番に）
      current = current.parent;
    }

    return chain;
  }

  public render() {
    return html`
      <li class="todo-item">
        <div class="todo-left">
          <parent-todo-display
            .ancestorChain=${this.buildAncestorChain(this.todo)}
          ></parent-todo-display>

          <div class="todo-main">
            <todo-content
              .content=${this.todo.content}
              .todoId=${this.todo.id}
            ></todo-content>

            <todo-meta
              .priority=${this.todo.priority}
              .due=${this.todo.due ?? undefined}
              .labels=${this.todo.labels}
            ></todo-meta>
          </div>
        </div>

        <div class="todo-actions">
          <todo-checkbox
            .taskId=${this.todo.id}
            .onComplete=${this.onCompleteTodo}
            checkboxTitle="タスクを完了にする"
          ></todo-checkbox>
        </div>
      </li>
    `;
  }

  public static styles = css`
    .todo-item {
      padding: 0.4em 0;
      border-bottom: 1px solid var(--border-color);
      transition: border-color 0.3s ease;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 1em;
    }

    .todo-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2em;
    }

    .todo-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1em;
    }

    .todo-actions {
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
    "todo-item": TodoItem;
  }
}
