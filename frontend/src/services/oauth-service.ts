import type {
  Permission,
  AuthTokenResponse,
} from "@doist/todoist-api-typescript/dist/authentication.js";
import { getAuthStateParameter } from "@doist/todoist-api-typescript/dist/authentication.js";

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  permissions: Permission[];
}

// SDKのAuthTokenResponseを使用
export type TokenResponse = AuthTokenResponse;

export class OAuthService {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * OAuth認証URLを生成（SDKの関数を使用）
   */
  generateAuthUrl(): string {
    // SDKのgetAuthStateParameter関数を使用してstateを生成
    const state = getAuthStateParameter();

    // stateをlocalStorageとsessionStorageの両方に保存（CSRF攻撃対策）
    localStorage.setItem("oauth_state", state);
    sessionStorage.setItem("oauth_state", state);

    // 手動で認証URLを構築（redirect_uriパラメータを含める）
    const baseUrl = "https://todoist.com/oauth/authorize";
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.permissions.join(","),
      state: state,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    return authUrl;
  }

  /**
   * 認証コードからアクセストークンを取得（SDKの関数を使用）
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<TokenResponse> {
    // state検証（localStorageとsessionStorageの両方をチェック）
    const savedStateLocal = localStorage.getItem("oauth_state");
    const savedStateSession = sessionStorage.getItem("oauth_state");
    const savedState = savedStateLocal || savedStateSession;

    // stateが見つからない場合でも、基本的なフォーマットチェックを行う
    if (!savedState) {
      console.warn(
        "🔐 [OAuth] 警告: 保存されたstateが見つかりません。stateの基本検証のみ実行します。"
      );

      // stateが有効なUUID形式かチェック
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(state)) {
        console.error("🔐 [OAuth] エラー: stateが無効な形式です");
        throw new Error("Invalid state parameter: Invalid format");
      }
    } else {
      if (savedState !== state) {
        console.error("🔐 [OAuth] エラー: stateが一致しません");
        throw new Error("Invalid state parameter: State mismatch");
      }
    }

    // stateを削除（両方から）
    localStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_state");

    // プロキシサーバー経由でトークン交換を実行（CORS問題を回避）
    try {
      const proxyUrl =
        import.meta.env.VITE_PROXY_URL || "http://localhost:8000";

      const requestUrl = `${proxyUrl}/oauth/token`;
      const requestBody = {
        client_id: this.config.clientId,
        code: code,
        redirect_uri: this.config.redirectUri,
      };

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const tokenData = await response.json();

      // トークンをlocalStorageに保存
      localStorage.setItem("todoist_token", tokenData.access_token);

      return {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type || "Bearer",
      };
    } catch (error) {
      console.error("🔐 [OAuth] トークン取得エラー:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to exchange code for token: ${errorMessage}`);
    }
  }

  /**
   * URLからコードとstateを抽出
   */
  extractAuthParams(url: string): {
    code?: string;
    state?: string;
    error?: string;
  } {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      code: params.get("code") || undefined,
      state: params.get("state") || undefined,
      error: params.get("error") || undefined,
    };
  }

  /**
   * 保存されたトークンを取得
   */
  getStoredToken(): string | null {
    return localStorage.getItem("todoist_token");
  }

  /**
   * トークンが有効かチェック
   */
  isTokenValid(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;

    const expiresAt = localStorage.getItem("todoist_token_expires_at");
    if (expiresAt) {
      return Date.now() < parseInt(expiresAt);
    }

    // 有効期限が不明な場合は有効とみなす
    return true;
  }

  /**
   * 認証情報をクリア（ローカルのみ）
   */
  clearAuth(): void {
    localStorage.removeItem("todoist_token");
    localStorage.removeItem("todoist_refresh_token");
    localStorage.removeItem("todoist_token_expires_at");
    localStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_state");
  }

  /**
   * 認証情報をクリアし、サーバー側でもトークンを無効化（SDKの関数を使用）
   */
  async revokeAndClearAuth(): Promise<void> {
    const token = this.getStoredToken();

    if (token) {
      try {
        // SDKのrevokeAuthToken関数を使用してサーバー側でトークンを無効化
        // プロキシサーバー経由でトークンを無効化
        const proxyUrl =
          import.meta.env.VITE_PROXY_URL || "http://localhost:8000";
        await fetch(`${proxyUrl}/oauth/revoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: this.config.clientId,
            access_token: token,
          }),
        });
      } catch (error) {
        console.warn("Failed to revoke token on server:", error);
        // サーバー側での無効化に失敗してもローカルの認証情報はクリアする
      }
    }

    // ローカルの認証情報をクリア
    this.clearAuth();
  }
}
