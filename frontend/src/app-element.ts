import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { AuthController } from "./controllers/auth-controller.js";
import { when } from "./utils/template-utils.js";
import "./components/auth-button.js";
import "./components/filtered-nested-tasks-panel.js";
import "./components/goal-milestone-panel.js";
import "./components/date-goal-panel.js";
import "./components/task-daily-completion-panel.js";
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
      const todoPanel = this.shadowRoot?.querySelector(
        "filtered-nested-todos-panel"
      ) as HTMLElement & {
        initializeService: (token: string) => void;
        reinitializeService: (token: string) => void;
      };
      if (todoPanel) {
        todoPanel.initializeService(token);
      }

      // ゴールマイルストーンパネルの初期化
      const goalPanel = this.shadowRoot?.querySelector(
        "goal-milestone-panel"
      ) as HTMLElement & {
        setTodoistService: (service: unknown) => void;
      };
      if (goalPanel) {
        // FilteredTodoControllerから TodoistService を取得する必要があるが、
        // 今は直接 TodoistService のインスタンスを作成
        import("./services/todoist-service.js").then(({ TodoistService }) => {
          const service = new TodoistService(token);
          goalPanel.setTodoistService(service);
        });
      }

      // 日付付きゴールパネルの初期化
      const dateGoalPanel = this.shadowRoot?.querySelector(
        "date-goal-panel"
      ) as HTMLElement & {
        setTodoistService: (service: unknown) => void;
      };
      if (dateGoalPanel) {
        import("./services/todoist-service.js").then(({ TodoistService }) => {
          const service = new TodoistService(token);
          dateGoalPanel.setTodoistService(service);
        });
      }

      // タスク完了統計パネルの初期化
      const completionPanel = this.shadowRoot?.querySelector(
        "todo-daily-completion-panel"
      ) as HTMLElement & {
        setToken: (token: string) => void;
      };
      if (completionPanel) {
        completionPanel.setToken(token);
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
    const todoPanel = this.shadowRoot?.querySelector(
      "filtered-nested-todos-panel"
    ) as HTMLElement & {
      clearService: () => void;
    };
    if (todoPanel) {
      todoPanel.clearService();
    }

    // 完了統計パネルのクリア
    const completionPanel = this.shadowRoot?.querySelector(
      "todo-daily-completion-panel"
    ) as HTMLElement & {
      clearToken: () => void;
    };
    if (completionPanel) {
      completionPanel.clearToken();
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
              <div class="left-panels">
                <goal-milestone-panel
                  class="goal-milestone-panel"
                ></goal-milestone-panel>
                <date-goal-panel class="date-goal-panel"></date-goal-panel>
              </div>
              <div class="right-panels">
                <todo-daily-completion-panel
                  class="completion-panel"
                ></todo-daily-completion-panel>
                <filtered-nested-todos-panel
                  class="todo-panel"
                ></filtered-nested-todos-panel>
              </div>
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
      grid-template-columns: 3fr 7fr;
      gap: 1rem;
      align-items: start;
      width: 100%; /* コンテナの幅を明示的に設定 */
      overflow: hidden; /* はみ出しを防ぐ */
    }

    .left-panels {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .right-panels {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 0; /* フレックスアイテムの最小幅を0に設定 */
      max-width: 100%; /* 親の幅を超えないように制限 */
    }

    .goal-milestone-panel,
    .date-goal-panel {
      grid-column: 1;
    }

    .completion-panel,
    .todo-panel {
      grid-column: 2;
      min-width: 0; /* 内容が親の幅を超えないように制限 */
      max-width: 100%;
      overflow-wrap: break-word; /* 長いテキストを強制改行 */
    }

    /* レスポンシブ対応: 768px以下でモバイルレイアウト */
    @media (max-width: 768px) {
      .panels-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
      }

      .left-panels {
        grid-column: 1;
        grid-row: 1;
      }

      .right-panels {
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
