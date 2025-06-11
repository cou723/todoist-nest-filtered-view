import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { AuthController } from "./controllers/auth-controller.js";
import { TaskController } from "./controllers/task-controller.js";
import { FilterController } from "./controllers/filter-controller.js";
import { when } from "./utils/template-utils.js";
import "./components/auth-component.js";
import "./components/task-filter.js";
import "./components/task-list.js";
import "./components/ui/theme-toggle.js";
import "./components/ui/panel.js";

@customElement("app-element")
export class AppElement extends LitElement {
  // Reactive Controllers
  private authController = new AuthController(this);
  private taskController = new TaskController(this);
  private filterController = new FilterController(this);

  public connectedCallback() {
    super.connectedCallback();
    // 認証状態が確認された後にタスクサービスを初期化
    if (this.authController.isAuthenticated) {
      this.initializeTaskService();
    }
  }

  private async initializeTaskService() {
    const token = this.authController.getStoredToken();
    if (!token) return;

    this.taskController.initializeService(token);
    // 初回起動時にもフィルターを反映
    await this.taskController.fetchTasksByFilter(
      this.filterController.getCurrentQuery()
    );
  }

  private async handleAuthLogin(e: CustomEvent) {
    const { token } = e.detail;
    this.authController.login(token);

    // タスクサービスを再初期化
    this.taskController.reinitializeService(token);
    await this.taskController.fetchTasksByFilter(
      this.filterController.getCurrentQuery()
    );
  }

  private handleAuthLogout() {
    this.authController.logout();
    this.taskController.clearService();
    this.filterController.clearFilter();
  }

  private async handleFilterApply(e: CustomEvent) {
    const { query } = e.detail;
    this.filterController.applyFilter(query);

    if (query.trim()) {
      await this.taskController.fetchTasksByFilter(query);
    } else {
      await this.taskController.fetchTasksByFilter();
    }
  }

  private async handleFilterClear() {
    this.filterController.clearFilter();
    await this.taskController.fetchTasksByFilter();
  }

  private async handleCompleteTask(taskId: string) {
    await this.taskController.completeTask(taskId);
  }

  public render() {
    return html`
      <div class="app-container">
        <theme-toggle></theme-toggle>
        <ui-panel>
          <div class="header">
            <h1>タスク</h1>
          </div>
          <auth-component
            .isAuthenticated=${this.authController.isAuthenticated}
            @auth-login=${this.handleAuthLogin}
            @auth-logout=${this.handleAuthLogout}
          ></auth-component>
          ${when(
            this.authController.isAuthenticated,
            () => html`
              <task-filter
                @filter-apply=${this.handleFilterApply}
                @filter-clear=${this.handleFilterClear}
              ></task-filter>
              <task-list
                .tasks=${this.taskController.tasks}
                .loading=${this.taskController.loading}
                .error=${this.taskController.error}
                .onCompleteTask=${this.handleCompleteTask.bind(this)}
              ></task-list>
            `
          )}
        </ui-panel>
      </div>
    `;
  }

  public static styles = css`
    :host {
      margin: 0.5rem auto;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .header h1 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "app-element": AppElement;
  }
}
