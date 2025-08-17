import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { DateGoalController } from "../controllers/date-goal-controller.js";
import { TodoistService } from "../services/todoist-service.js";
import "./ui/panel.js";

@customElement("date-goal-panel")
export class DateGoalPanel extends LitElement {
  private dateGoalController = new DateGoalController(this);

  public setTodoistService(service: TodoistService) {
    this.dateGoalController.initializeService(service);
  }

  public render() {
    return html`
      <ui-panel>
        <div class="date-goal-content">
          <h2>日付付きゴールタスク</h2>
          ${this.renderContent()}
        </div>
      </ui-panel>
    `;
  }

  private renderContent() {
    if (this.dateGoalController.loading)
      return html`<p class="loading">読み込み中...</p>`;

    if (this.dateGoalController.error)
      return html`<p class="error">${this.dateGoalController.error}</p>`;

    if (this.dateGoalController.dateGoalTodos.length === 0)
      return html`<p class="empty">日付付きゴールタスクがありません</p>`;

    return this.renderTodos();
  }

  private renderTodos() {
    return html`
      <div class="todos-list">
        ${this.dateGoalController.dateGoalTodos.map(
          (todo) => html`
            <div class="todo-item">
              <div class="todo-content">
                <div class="todo-title">${todo.content}</div>
                <div
                  class="todo-date ${this.dateGoalController.getDaysUntilDateColorClass(
                    todo.daysUntilDate
                  )}"
                >
                  ${this.dateGoalController.getDaysUntilDateText(
                    todo.daysUntilDate
                  )}
                </div>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  public static styles = css`
    .date-goal-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .date-goal-content h2 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .loading,
    .error,
    .empty {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
      padding: 1rem;
    }

    .error {
      color: var(--error-color);
    }

    .todos-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .todo-item {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background: var(--surface-color);
      transition: background-color 0.2s ease;
    }

    .todo-item:hover {
      background: var(--surface-hover-color);
    }

    .todo-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .todo-title {
      flex: 1;
      font-size: 0.9rem;
      color: var(--text-color);
      word-break: break-word;
    }

    .todo-date {
      font-size: 0.8rem;
      font-weight: bold;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      white-space: nowrap;
    }

    .todo-date.overdue {
      background: var(--error-bg-color);
      color: var(--error-color);
    }

    .todo-date.today {
      background: var(--warning-bg-color);
      color: var(--warning-color);
    }

    .todo-date.urgent {
      background: var(--info-bg-color);
      color: var(--info-color);
    }

    .todo-date.soon {
      background: var(--success-bg-color);
      color: var(--success-color);
    }

    .todo-date.normal {
      background: var(--neutral-bg-color);
      color: var(--neutral-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "date-goal-panel": DateGoalPanel;
  }
}
