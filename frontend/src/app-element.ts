import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { AuthController } from "./controllers/auth-controller.js";
import { when } from "./utils/template-utils.js";
import "./components/auth-button.js";
import "./components/filtered-nested-tasks-panel.js";
import "./components/goal-milestone-panel.js";
import "./components/ui/theme-toggle.js";

@customElement("app-element")
export class AppElement extends LitElement {
  private authController = new AuthController(this);

  public connectedCallback() {
    super.connectedCallback();
    if (this.authController.isAuthenticated) {
      this.initializePanels();
    }
  }

  private initializePanels() {
    const token = this.authController.getStoredToken();
    if (!token) return;

    // パネルの初期化は updated() で行う
    this.requestUpdate();
  }

  protected updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    const token = this.authController.getStoredToken();

    if (token && this.authController.isAuthenticated) {
      // タスクパネルの初期化
      const taskPanel = this.shadowRoot?.querySelector(
        "filtered-nested-tasks-panel"
      ) as HTMLElement & {
        initializeService: (token: string) => void;
        reinitializeService: (token: string) => void;
      };
      if (taskPanel) {
        taskPanel.initializeService(token);
      }

      // ゴールマイルストーンパネルの初期化
      const goalPanel = this.shadowRoot?.querySelector(
        "goal-milestone-panel"
      ) as HTMLElement & {
        setTodoistService: (service: unknown) => void;
      };
      if (goalPanel) {
        // FilteredTaskControllerから TodoistService を取得する必要があるが、
        // 今は直接 TodoistService のインスタンスを作成
        import("./services/todoist-service.js").then(({ TodoistService }) => {
          const service = new TodoistService(token);
          goalPanel.setTodoistService(service);
        });
      }
    }
  }

  private async handleAuthLogin(e: CustomEvent) {
    const { token } = e.detail;
    this.authController.login(token);
    this.initializePanels();
  }

  private handleAuthLogout() {
    this.authController.logout();

    // パネルのクリア
    const taskPanel = this.shadowRoot?.querySelector(
      "filtered-nested-tasks-panel"
    ) as HTMLElement & {
      clearService: () => void;
    };
    if (taskPanel) {
      taskPanel.clearService();
    }
  }

  public render() {
    return html`
      <div class="app-container">
        <div class="auth-header">
          <theme-toggle></theme-toggle>
          <auth-button
            .isAuthenticated=${this.authController.isAuthenticated}
            @auth-login=${this.handleAuthLogin}
            @auth-logout=${this.handleAuthLogout}
          ></auth-button>
        </div>
        ${when(
          this.authController.isAuthenticated,
          () => html`
            <div class="panels-container">
              <goal-milestone-panel
                class="goal-milestone-panel"
              ></goal-milestone-panel>
              <filtered-nested-tasks-panel
                class="task-panel"
              ></filtered-nested-tasks-panel>
            </div>
          `
        )}
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

    .auth-header {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
    }

    .panels-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1rem;
      align-items: start;
    }

    .goal-milestone-panel {
      grid-column: 1;
    }

    .task-panel {
      grid-column: 2;
    }

    /* レスポンシブ対応: 768px以下でモバイルレイアウト */
    @media (max-width: 768px) {
      .panels-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
      }

      .goal-milestone-panel {
        grid-column: 1;
        grid-row: 1;
      }

      .task-panel {
        grid-column: 1;
        grid-row: 2;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "app-element": AppElement;
  }
}
