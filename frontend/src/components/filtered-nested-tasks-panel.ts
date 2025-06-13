import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { FilteredTaskController } from "../controllers/filtered-task-controller.js";
import { FilterController } from "../controllers/filter-controller.js";
import "./setting-button.js";
import "./setting-modal.js";
import "./task-list.js";
import "./ui/panel.js";

@customElement("filtered-nested-tasks-panel")
export class FilteredNestedTasksPanel extends LitElement {
  private filteredTaskController = new FilteredTaskController(this);
  private filterController = new FilterController(this);

  @state()
  private settingModalOpen = false;

  public initializeService(token: string) {
    this.filteredTaskController.initializeService(token);
    // 初回起動時にもフィルターを反映
    this.fetchTasksByFilter(this.filterController.getCurrentQuery());
  }

  public reinitializeService(token: string) {
    this.filteredTaskController.reinitializeService(token);
    this.fetchTasksByFilter(this.filterController.getCurrentQuery());
  }

  public clearService() {
    this.filteredTaskController.clearService();
    this.filterController.clearFilter();
  }

  private async fetchTasksByFilter(query?: string) {
    await this.filteredTaskController.fetchTasksByFilter(query);
  }

  private async handleFilterApply(e: CustomEvent) {
    const { query } = e.detail;
    this.filterController.applyFilter(query);

    if (query.trim()) {
      await this.filteredTaskController.fetchTasksByFilter(query);
    } else {
      await this.filteredTaskController.fetchTasksByFilter();
    }
  }

  private async handleFilterClear() {
    this.filterController.clearFilter();
    await this.filteredTaskController.fetchTasksByFilter();
  }

  private async handleCompleteTask(taskId: string) {
    await this.filteredTaskController.completeTask(taskId);
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
        <task-list
          .tasks=${this.filteredTaskController.tasks}
          .loading=${this.filteredTaskController.loading}
          .error=${this.filteredTaskController.error}
          .onCompleteTask=${this.handleCompleteTask.bind(this)}
        ></task-list>
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
    "filtered-nested-tasks-panel": FilteredNestedTasksPanel;
  }
}