import type { ReactiveController, ReactiveControllerHost } from "lit";
import { OAuthService } from "../services/oauth-service.js";
import { getOAuthConfig } from "../config/oauth-config.js";

export interface AuthControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class AuthController implements ReactiveController {
  private host: AuthControllerHost;
  private oauthService: OAuthService;

  // 状態
  public isAuthenticated: boolean = false;
  public isProcessingAuth: boolean = false;
  public authError: string = "";

  constructor(host: AuthControllerHost) {
    this.host = host;
    this.oauthService = new OAuthService(getOAuthConfig());
    host.addController(this);
  }

  hostConnected() {
    this.checkAuthenticationStatus();
  }

  hostDisconnected() {
    // 必要に応じてクリーンアップ処理
  }

  // 認証状態の確認
  checkAuthenticationStatus(): void {
    const token = this.oauthService.getStoredToken();
    if (token && this.oauthService.isTokenValid()) {
      this.isAuthenticated = true;
    } else {
      // 無効なトークンがある場合はクリア
      this.oauthService.clearAuth();
      this.isAuthenticated = false;
    }
    this.host.requestUpdate();
  }

  login(token: string): void {
    // トークンをLocalStorageに保存
    localStorage.setItem("todoist_token", token);
    this.isAuthenticated = true;
    this.authError = "";
    this.host.requestUpdate();
  }

  logout(): void {
    this.oauthService.clearAuth();
    this.isAuthenticated = false;
    this.authError = "";
    this.isProcessingAuth = false;
    this.host.requestUpdate();
  }

  setProcessingAuth(isProcessing: boolean): void {
    this.isProcessingAuth = isProcessing;
    this.host.requestUpdate();
  }

  // 認証エラーの設定
  setAuthError(error: string): void {
    this.authError = error;
    this.host.requestUpdate();
  }

  // 認証エラーのクリア
  clearAuthError(): void {
    this.authError = "";
    this.host.requestUpdate();
  }

  // 保存されたトークンの取得
  getStoredToken(): string | null {
    return this.oauthService.getStoredToken();
  }

  // OAuth サービスの取得
  getOAuthService(): OAuthService {
    return this.oauthService;
  }
}
