import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { layoutStyles } from "../styles/common.js";
import { AuthController } from "../controllers/auth-controller.js";
import "./ui/button.js";
import "./ui/modal.js";

@customElement("auth-button")
export class AuthButton extends LitElement {
  @property({ type: Boolean })
  public isAuthenticated = false;

  private authController: AuthController;

  constructor() {
    super();
    this.authController = new AuthController(this);
  }

  public connectedCallback() {
    super.connectedCallback();
    // コントローラーの認証状態を同期
    this.isAuthenticated = this.authController.isAuthenticated;

    // ページ読み込み時にOAuth認証コールバックをチェック
    this.checkOAuthCallback();
  }

  public updated(changedProperties: Map<string, string>) {
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
      } catch (error: unknown) {
        this.authController.setAuthError(
          `認証に失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`
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

  public render() {
    if (this.isAuthenticated) {
      return html`
        <ui-button
          @click=${() => {
            this.authController.logout();
            this.dispatchEvent(
              new CustomEvent("auth-logout", {
                bubbles: true,
                composed: true,
              })
            );
          }}
          >ログアウト</ui-button
        >
      `;
    }

    return html`
      <ui-modal ?open=${this.authController.isProcessingAuth}>
        <div class="auth-box">
          <h2>認証処理中...</h2>
          <div class="loading-spinner"></div>
          <p>Todoistからの認証情報を処理しています。</p>
        </div>
      </ui-modal>
      <div class="auth-container">
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
        ${this.authController.authError
          ? html`<div class="error-message">${this.authController.authError}</div>`
          : ""}
      </div>
    `;
  }

  public static styles = [
    layoutStyles,
    css`
      .auth-container {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
      }

      .auth-box {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
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

      .error-message {
        color: var(--error-color, #dc3545);
        font-size: 0.875rem;
        padding: 0.5rem;
        background-color: var(--error-bg-color, #f8d7da);
        border: 1px solid var(--error-border-color, #f5c6cb);
        border-radius: 4px;
        max-width: 300px;
        text-align: left;
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
    "auth-button": AuthButton;
  }
}
