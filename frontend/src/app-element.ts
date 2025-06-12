import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { AuthController } from "./controllers/auth-controller.js";
import { TaskController } from "./controllers/task-controller.js";
import { FilterController } from "./controllers/filter-controller.js";
import { when } from "./utils/template-utils.js";
import "./components/auth-button.js";
import "./components/setting-button.js";
import "./components/setting-modal.js";
import "./components/task-list.js";
import "./components/ui/theme-toggle.js";
import "./components/ui/panel.js";

@customElement("app-element")
export class AppElement extends LitElement {
  // Reactive Controllers
  private authController = new AuthController(this);
  private taskController = new TaskController(this);
  private filterController = new FilterController(this);

  @state()
  private settingModalOpen = false;

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
            <div class="header-actions">
              <setting-button
                @settings-click=${() => (this.settingModalOpen = true)}
              ></setting-button>
              <auth-button
                .isAuthenticated=${this.authController.isAuthenticated}
                @auth-login=${this.handleAuthLogin}
                @auth-logout=${this.handleAuthLogout}
              ></auth-button>
            </div>
          </div>
          ${when(
            this.authController.isAuthenticated,
            () => html`
              <setting-modal
                .modalOpen=${this.settingModalOpen}
                @filter-apply=${this.handleFilterApply}
                @filter-clear=${this.handleFilterClear}
                @modal-close=${() => (this.settingModalOpen = false)}
              ></setting-modal>
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
    "app-element": AppElement;
  }
}
