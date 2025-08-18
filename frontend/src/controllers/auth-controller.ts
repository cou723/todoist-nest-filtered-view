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
  public isAuthenticated = false;
  public isProcessingAuth = false;
  public authError = "";

  constructor(host: AuthControllerHost) {
    this.host = host;
    this.oauthService = new OAuthService(getOAuthConfig());
    host.addController(this);
  }

  public hostConnected() {
    this.checkAuthenticationStatus();
  }

  public hostDisconnected() {
    // 必要に応じてクリーンアップ処理
  }

  // 認証状態の確認
  private checkAuthenticationStatus(): void {
    const token = this.oauthService.getStoredToken();
    const isTokenValid = this.oauthService.isTokenValid();
    
    console.log("[AuthController] 認証状態確認:", {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isTokenValid,
      isAuthenticated: this.isAuthenticated
    });

    if (token && isTokenValid) {
      this.isAuthenticated = true;
    } else {
      // 無効なトークンがある場合はクリア
      console.warn("[AuthController] 無効なトークンを検出、クリアします");
      this.oauthService.clearAuth();
      this.isAuthenticated = false;
    }
    this.host.requestUpdate();
  }

  // トークンの詳細状態を確認するメソッド（デバッグ用）
  public validateTokenStatus(): { hasToken: boolean; isValid: boolean; error?: string } {
    try {
      const token = this.oauthService.getStoredToken();
      const isValid = this.oauthService.isTokenValid();
      
      console.log("[AuthController] トークン状態詳細:", {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null,
        isValid,
        localStorage: localStorage.getItem("todoist_token") ? "存在" : "なし"
      });

      return {
        hasToken: !!token,
        isValid,
        error: !token ? "トークンがありません" : !isValid ? "トークンが無効です" : undefined
      };
    } catch (error) {
      console.error("[AuthController] トークン状態確認エラー:", error);
      return {
        hasToken: false,
        isValid: false,
        error: `トークン確認エラー: ${error}`
      };
    }
  }

  public login(token: string): void {
    // トークンをLocalStorageに保存
    localStorage.setItem("todoist_token", token);
    this.isAuthenticated = true;
    this.authError = "";
    this.host.requestUpdate();
  }

  public logout(): void {
    this.oauthService.clearAuth();
    this.isAuthenticated = false;
    this.authError = "";
    this.isProcessingAuth = false;
    this.host.requestUpdate();
  }

  public setProcessingAuth(isProcessing: boolean): void {
    this.isProcessingAuth = isProcessing;
    this.host.requestUpdate();
  }

  // 認証エラーの設定
  public setAuthError(error: string): void {
    this.authError = error;
    this.host.requestUpdate();
  }

  // 認証エラーのクリア
  public clearAuthError(): void {
    this.authError = "";
    this.host.requestUpdate();
  }

  // 保存されたトークンの取得
  public getStoredToken(): string | null {
    return this.oauthService.getStoredToken();
  }

  // OAuth サービスの取得
  public getOAuthService(): OAuthService {
    return this.oauthService;
  }
}
