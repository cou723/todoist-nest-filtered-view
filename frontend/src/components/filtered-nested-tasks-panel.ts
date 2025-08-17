import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { FilteredTodoController } from "../controllers/filtered-task-controller.js";
import { FilterController } from "../controllers/filter-controller.js";
import "./setting-button.js";
import "./setting-modal.js";
import "./task-list.js";
import "./ui/panel.js";

@customElement("filtered-nested-todos-panel")
export class FilteredNestedTodosPanel extends LitElement {
  private filteredTodoController = new FilteredTodoController(this);
  private filterController = new FilterController(this);

  @state()
  private settingModalOpen = false;

  public initializeService(token: string) {
    this.filteredTodoController.initializeService(token);
    // 初回起動時にもフィルターを反映
    this.fetchTodosByFilter(
      this.filterController.getCurrentQuery(),
      this.filterController.getHideDepTodos()
    );
  }

  public reinitializeService(token: string) {
    this.filteredTodoController.reinitializeService(token);
    this.fetchTodosByFilter(
      this.filterController.getCurrentQuery(),
      this.filterController.getHideDepTodos()
    );
  }

  public clearService() {
    this.filteredTodoController.clearService();
    this.filterController.clearFilter();
  }

  private async fetchTodosByFilter(query?: string, hideDepTodos?: boolean) {
    await this.filteredTodoController.fetchTodosByFilter(query, hideDepTodos);
  }

  private async handleFilterApply(e: CustomEvent) {
    const { query, hideDepTodos } = e.detail;
    this.filterController.applyFilter(query, hideDepTodos);

    if (query.trim()) {
      await this.filteredTodoController.fetchTodosByFilter(query, hideDepTodos);
    } else {
      await this.filteredTodoController.fetchTodosByFilter(undefined, hideDepTodos);
    }
  }

  private async handleFilterClear() {
    this.filterController.clearFilter();
    await this.filteredTodoController.fetchTodosByFilter(undefined, false);
  }

  private async handleCompleteTodo(todoId: string) {
    await this.filteredTodoController.completeTodo(todoId);
  }

  public render() {
    return html`
      <ui-panel>
        <div class="header">
          <h1>タスク</h1>
          <div class="header-actions">
            <setting-button
              @settings-click=${() => (this.settingModalOpen = true)}
            ></setting-button>
          </div>
        </div>
        <setting-modal
          .modalOpen=${this.settingModalOpen}
          @filter-apply=${this.handleFilterApply}
          @filter-clear=${this.handleFilterClear}
          @modal-close=${() => (this.settingModalOpen = false)}
        ></setting-modal>
        <todo-list
          .todos=${this.filteredTodoController.todos}
          .loading=${this.filteredTodoController.loading}
          .error=${this.filteredTodoController.error}
          .onCompleteTodo=${this.handleCompleteTodo.bind(this)}
        ></todo-list>
      </ui-panel>
    `;
  }

  public static styles = css`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 2rem;
      display: flex;
      align-items: center;
    }

    .header h1 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "filtered-nested-todos-panel": FilteredNestedTodosPanel;
  }
}
