import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { TaskWithParent } from "./types/task.js";
import { TodoistService } from "./services/todoist-service.js";
import { OAuthService } from "./services/oauth-service.js";
import { getOAuthConfig } from "./config/oauth-config.js";
import "./components/auth-component.js";
import "./components/task-filter.js";
import "./components/task-list.js";
import "./components/ui/theme-toggle.js";

@customElement("app-element")
export class AppElement extends LitElement {
  @state()
  private isAuthenticated: boolean = false;

  @state()
  private tasks: TaskWithParent[] = [];

  @state()
  private loading: boolean = false;

  @state()
  private error: string = "";

  private todoistService: TodoistService | null = null;
  private currentRequestController: AbortController | null = null;
  private oauthService: OAuthService;

  constructor() {
    super();
    this.oauthService = new OAuthService(getOAuthConfig());
  }

  connectedCallback() {
    super.connectedCallback();
    this.checkAuthenticationStatus();
  }

  private checkAuthenticationStatus() {
    const token = this.oauthService.getStoredToken();
    if (token && this.oauthService.isTokenValid()) {
      this.isAuthenticated = true;
      this.initializeService();
    } else {
      // 無効なトークンがある場合はクリア
      this.oauthService.clearAuth();
      this.isAuthenticated = false;
    }
  }

  private async initializeService() {
    const token = this.oauthService.getStoredToken();
    if (!token) return;

    this.todoistService = new TodoistService(token);
    await this.fetchAllTasks();
  }

  private async fetchAllTasks() {
    if (!this.todoistService) return;

    // 進行中のリクエストをキャンセル
    if (this.currentRequestController) {
      this.currentRequestController.abort();
    }
    this.currentRequestController = new AbortController();

    this.loading = true;
    this.error = "";
    try {
      this.tasks = await this.todoistService.getAllTasks();
    } catch (e: any) {
      // AbortErrorの場合は無視（意図的なキャンセル）
      if (e.name === "AbortError") {
        return;
      }
      this.error = "タスク取得に失敗しました: " + (e?.message || e);
      this.tasks = [];
    } finally {
      this.loading = false;
      this.currentRequestController = null;
    }
  }

  private async fetchTasksByFilter(query: string) {
    if (!this.todoistService || !query.trim()) return;

    // 進行中のリクエストをキャンセル
    if (this.currentRequestController) {
      this.currentRequestController.abort();
    }
    this.currentRequestController = new AbortController();

    this.loading = true;
    this.error = "";
    try {
      this.tasks = await this.todoistService.getTasksByFilter(query);
    } catch (e: any) {
      // AbortErrorの場合は無視（意図的なキャンセル）
      if (e.name === "AbortError") {
        return;
      }
      this.error = "フィルタリングに失敗しました: " + (e?.message || e);
      this.tasks = [];
    } finally {
      this.loading = false;
      this.currentRequestController = null;
    }
  }

  private async handleAuthLogin(e: CustomEvent) {
    const { token } = e.detail;
    this.isAuthenticated = true;
    // 既存のサービスがある場合はキャッシュをクリアしてから新しいサービスを作成
    if (this.todoistService) {
      this.todoistService.clearCache();
    }
    this.todoistService = new TodoistService(token);
    await this.fetchAllTasks();
  }

  private handleAuthLogout() {
    // 進行中のリクエストをキャンセル
    if (this.currentRequestController) {
      this.currentRequestController.abort();
      this.currentRequestController = null;
    }

    // OAuth認証情報をクリア
    this.oauthService.clearAuth();

    this.isAuthenticated = false;
    this.tasks = [];
    this.todoistService = null;
    this.error = "";
  }

  private async handleFilterApply(e: CustomEvent) {
    const { query } = e.detail;
    if (query.trim()) {
      await this.fetchTasksByFilter(query);
    } else {
      await this.fetchAllTasks();
    }
  }

  private async handleFilterClear() {
    await this.fetchAllTasks();
  }

  render() {
    return html`
      <div class="app-container">
        <div class="header">
          <h1>Todoist タスクリスト</h1>
          <theme-toggle></theme-toggle>
        </div>

        <auth-component
          .isAuthenticated=${this.isAuthenticated}
          @auth-login=${this.handleAuthLogin}
          @auth-logout=${this.handleAuthLogout}
        ></auth-component>

        ${this.isAuthenticated
          ? html`
              <task-filter
                @filter-apply=${this.handleFilterApply}
                @filter-clear=${this.handleFilterClear}
              ></task-filter>

              <task-list
                .tasks=${this.tasks}
                .loading=${this.loading}
                .error=${this.error}
              ></task-list>
            `
          : ""}
      </div>
    `;
  }

  static styles = css`
    :host {
      max-width: 480px;
      margin: 2rem auto;
      padding: 2rem;
      text-align: center;
      display: block;
      background: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 2px 8px var(--card-shadow);
      color: var(--text-color);
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "app-element": AppElement;
  }
}
