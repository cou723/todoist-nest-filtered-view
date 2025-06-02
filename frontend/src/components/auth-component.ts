import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { layoutStyles } from "../styles/common.js";
import { AuthController } from "../controllers/auth-controller.js";
import { when } from "../utils/template-utils.js";
import "./ui/button.js";
import "./ui/input.js";

@customElement("auth-component")
export class AuthComponent extends LitElement {
  @property({ type: Boolean })
  isAuthenticated: boolean = false;

  @state()
  private token: string = "";

  @state()
  private showManualTokenInput: boolean = false;

  private authController: AuthController;

  constructor() {
    super();
    this.authController = new AuthController(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.token = this.authController.getStoredToken() || "";

    // コントローラーの認証状態を同期
    this.isAuthenticated = this.authController.isAuthenticated;

    // ページ読み込み時にOAuth認証コールバックをチェック
    this.checkOAuthCallback();
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // コントローラーの認証状態が変更された場合、プロパティを同期
    if (this.isAuthenticated !== this.authController.isAuthenticated) {
      this.isAuthenticated = this.authController.isAuthenticated;
    }
  }

  private async checkOAuthCallback() {
    const oauthService = this.authController.getOAuthService();
    const params = oauthService.extractAuthParams(window.location.href);

    if (params.error) {
      console.error("🔐 [Auth] OAuth認証エラー:", params.error);
      this.authController.setAuthError(`認証エラー: ${params.error}`);
      // URLからパラメータを削除
      this.clearUrlParams();
      return;
    }

    if (params.code && params.state) {
      this.authController.setProcessingAuth(true);
      this.authController.clearAuthError();

      try {
        const tokenResponse = await oauthService.exchangeCodeForToken(
          params.code,
          params.state
        );

        this.authController.login(tokenResponse.accessToken);
        this.dispatchEvent(
          new CustomEvent("auth-login", {
            detail: { token: tokenResponse.accessToken },
            bubbles: true,
            composed: true,
          })
        );
      } catch (error: any) {
        this.authController.setAuthError(
          `認証に失敗しました: ${error.message}`
        );
      } finally {
        this.clearUrlParams();
        this.authController.setProcessingAuth(false);
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

  private toggleManualTokenInput() {
    this.showManualTokenInput = !this.showManualTokenInput;
    this.authController.clearAuthError();
  }

  render() {
    if (this.isAuthenticated) {
      return html`
        <div class="header">
          <ui-button
            @click=${() => {
              this.authController.logout();
              this.token = "";
              this.showManualTokenInput = false;
              this.dispatchEvent(
                new CustomEvent("auth-logout", {
                  bubbles: true,
                  composed: true,
                })
              );
            }}
            >ログアウト</ui-button
          >
          <h2>タスク一覧</h2>
        </div>
      `;
    }

    if (this.authController.isProcessingAuth) {
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

        ${when(
          this.authController.authError,
          html`
            <div class="error-message">${this.authController.authError}</div>
          `
        )}
        ${!this.showManualTokenInput
          ? html`
              <div class="oauth-section">
                <p>Todoistアカウントでログインしてください</p>
                <ui-button
                  @click=${() => {
                    const oauthService = this.authController.getOAuthService();
                    const authUrl = oauthService.generateAuthUrl();
                    window.location.href = authUrl;
                  }}
                  variant="primary"
                >
                  Todoistでログイン
                </ui-button>
                <ui-button
                  あー
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
                  @input-change=${(e: CustomEvent) => {
                    this.token = e.detail.value;
                  }}
                  placeholder="Todoist APIトークン"
                ></ui-input>
                <div class="manual-buttons">
                  <ui-button
                    @click=${() => {
                      if (this.token.trim()) {
                        this.authController.login(this.token);
                        this.dispatchEvent(
                          new CustomEvent("auth-login", {
                            detail: { token: this.token },
                            bubbles: true,
                            composed: true,
                          })
                        );
                      }
                    }}
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
