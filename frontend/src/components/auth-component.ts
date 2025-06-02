import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { layoutStyles } from "../styles/common.js";
import { OAuthService } from "../services/oauth-service.js";
import { getOAuthConfig } from "../config/oauth-config.js";
import "./ui/button.js";
import "./ui/input.js";

@customElement("auth-component")
export class AuthComponent extends LitElement {
  @property({ type: Boolean })
  isAuthenticated: boolean = false;

  @state()
  private token: string = "";

  @state()
  private isProcessingAuth: boolean = false;

  @state()
  private authError: string = "";

  @state()
  private showManualTokenInput: boolean = false;

  private oauthService: OAuthService;

  constructor() {
    super();
    this.oauthService = new OAuthService(getOAuthConfig());
  }

  connectedCallback() {
    super.connectedCallback();
    this.token = localStorage.getItem("todoist_token") || "";

    // ページ読み込み時にOAuth認証コールバックをチェック
    this.checkOAuthCallback();
  }

  private async checkOAuthCallback() {
    console.log("🔐 [Auth] OAuth コールバックをチェック中");
    console.log("🔐 [Auth] 現在のURL:", window.location.href);

    const params = this.oauthService.extractAuthParams(window.location.href);
    console.log("🔐 [Auth] 抽出されたパラメータ:", params);

    if (params.error) {
      console.error("🔐 [Auth] OAuth認証エラー:", params.error);
      this.authError = `認証エラー: ${params.error}`;
      // URLからパラメータを削除
      this.clearUrlParams();
      return;
    }

    if (params.code && params.state) {
      console.log("🔐 [Auth] codeとstateが見つかりました - 認証処理を開始");
      this.isProcessingAuth = true;
      this.authError = "";

      try {
        const tokenResponse = await this.oauthService.exchangeCodeForToken(
          params.code,
          params.state
        );
        console.log("🔐 [Auth] トークン取得成功");

        this.dispatchEvent(
          new CustomEvent("auth-login", {
            detail: { token: tokenResponse.accessToken },
            bubbles: true,
            composed: true,
          })
        );
      } catch (error: any) {
        this.authError = `認証に失敗しました: ${error.message}`;
      } finally {
        this.clearUrlParams();
        this.isProcessingAuth = false;
      }
    }
  }

  private clearUrlParams() {
    // URLからOAuthパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    window.history.replaceState({}, document.title, url.toString());
  }

  private handleOAuthLogin() {
    console.log("🔐 [Auth] OAuth認証を開始");
    const authUrl = this.oauthService.generateAuthUrl();
    console.log("🔐 [Auth] リダイレクト先:", authUrl);
    window.location.href = authUrl;
  }

  private handleTokenInput(e: CustomEvent) {
    this.token = e.detail.value;
  }

  private handleManualLogin() {
    if (this.token.trim()) {
      localStorage.setItem("todoist_token", this.token);
      this.dispatchEvent(
        new CustomEvent("auth-login", {
          detail: { token: this.token },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private handleLogout() {
    this.oauthService.clearAuth();
    this.token = "";
    this.authError = "";
    this.showManualTokenInput = false;
    this.dispatchEvent(
      new CustomEvent("auth-logout", {
        bubbles: true,
        composed: true,
      })
    );
  }

  private toggleManualTokenInput() {
    this.showManualTokenInput = !this.showManualTokenInput;
    this.authError = "";
  }

  render() {
    if (this.isAuthenticated) {
      return html`
        <div class="header">
          <ui-button @click=${this.handleLogout}>ログアウト</ui-button>
          <h2>タスク一覧</h2>
        </div>
      `;
    }

    if (this.isProcessingAuth) {
      return html`
        <div class="auth-box">
          <h2>認証処理中...</h2>
          <div class="loading-spinner"></div>
          <p>Todoistからの認証情報を処理しています。</p>
        </div>
      `;
    }

    return html`
      <div class="auth-box">
        <h2>Todoistにログイン</h2>

        ${this.authError
          ? html` <div class="error-message">${this.authError}</div> `
          : ""}
        ${!this.showManualTokenInput
          ? html`
              <div class="oauth-section">
                <p>Todoistアカウントでログインしてください</p>
                <ui-button @click=${this.handleOAuthLogin} variant="primary">
                  Todoistでログイン
                </ui-button>
                <ui-button
                  @click=${this.toggleManualTokenInput}
                  variant="secondary"
                >
                  APIトークンで手動ログイン
                </ui-button>
              </div>
            `
          : html`
              <div class="manual-section">
                <p>Todoist APIトークンを入力してください</p>
                <ui-input
                  type="password"
                  .value=${this.token}
                  @input-change=${this.handleTokenInput}
                  placeholder="Todoist APIトークン"
                ></ui-input>
                <div class="manual-buttons">
                  <ui-button @click=${this.handleManualLogin}
                    >ログイン</ui-button
                  >
                  <ui-button
                    @click=${this.toggleManualTokenInput}
                    variant="secondary"
                  >
                    戻る
                  </ui-button>
                </div>
              </div>
            `}
      </div>
    `;
  }

  static styles = [
    layoutStyles,
    css`
      .auth-box {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1em;
      }

      .oauth-section,
      .manual-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        width: 100%;
      }

      .manual-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .error-message {
        background-color: var(--error-bg, #fee);
        color: var(--error-color, #c33);
        padding: 0.75rem;
        border-radius: 4px;
        border: 1px solid var(--error-border, #fcc);
        width: 100%;
        text-align: center;
        font-size: 0.9rem;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border-color, #e0e0e0);
        border-top: 4px solid var(--primary-color, #007bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 1rem auto;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      ui-input {
        width: 80%;
        margin-top: 0.5em;
      }

      h2 {
        color: var(--text-color);
        margin: 0;
      }

      p {
        color: var(--text-color);
        margin: 0.5rem 0;
        text-align: center;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "auth-component": AuthComponent;
  }
}
