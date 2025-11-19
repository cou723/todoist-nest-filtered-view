import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OAuthService } from "../oauth-service.js";
import type { OAuthConfig } from "../oauth-service.js";

// localStorageとsessionStorageのモック実装
class StorageMock implements Storage {
  private store: Record<string, string> = {};

  public get length(): number {
    return Object.keys(this.store).length;
  }

  public clear(): void {
    this.store = {};
  }

  public getItem(key: string): string | null {
    return this.store[key] || null;
  }

  public key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  public removeItem(key: string): void {
    delete this.store[key];
  }

  public setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe("OAuthService", () => {
  let oauthService: OAuthService;
  let config: OAuthConfig;
  let localStorageMock: StorageMock;
  let sessionStorageMock: StorageMock;

  beforeEach(() => {
    // localStorageとsessionStorageをモック
    localStorageMock = new StorageMock();
    sessionStorageMock = new StorageMock();
    
    // グローバルオブジェクトに設定
    global.localStorage = localStorageMock as Storage;
    global.sessionStorage = sessionStorageMock as Storage;
    
    config = {
      clientId: "test-client-id",
      redirectUri: "http://localhost:5173/",
      permissions: ["data:read_write"],
    };
    oauthService = new OAuthService(config);
  });

  afterEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe("generateAuthUrl", () => {
    it("should generate correct OAuth URL with state parameter", () => {
      const authUrl = oauthService.generateAuthUrl();
      
      expect(authUrl).toContain("https://todoist.com/oauth/authorize");
      expect(authUrl).toContain(`client_id=${config.clientId}`);
      expect(authUrl).toContain("scope=data%3Aread_write");
      expect(authUrl).toContain("response_type=code");
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(config.redirectUri)}`);
      expect(authUrl).toContain("state=");
    });

    it("should save state to localStorage and sessionStorage", () => {
      oauthService.generateAuthUrl();
      
      const localState = localStorage.getItem("oauth_state");
      const sessionState = sessionStorage.getItem("oauth_state");
      
      expect(localState).toBeTruthy();
      expect(sessionState).toBeTruthy();
      expect(localState).toBe(sessionState);
    });

    it("should generate UUID format state parameter", () => {
      const authUrl = oauthService.generateAuthUrl();
      const url = new URL(authUrl);
      const state = url.searchParams.get("state");
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(state).toMatch(uuidRegex);
    });
  });

  describe("extractAuthParams", () => {
    it("should extract code and state from URL", () => {
      const testUrl = "http://localhost:5173/?code=test-code&state=test-state";
      const params = oauthService.extractAuthParams(testUrl);
      
      expect(params.code).toBe("test-code");
      expect(params.state).toBe("test-state");
      expect(params.error).toBeUndefined();
    });

    it("should extract error from URL", () => {
      const testUrl = "http://localhost:5173/?error=access_denied";
      const params = oauthService.extractAuthParams(testUrl);
      
      expect(params.error).toBe("access_denied");
      expect(params.code).toBeUndefined();
      expect(params.state).toBeUndefined();
    });

    it("should return undefined for missing parameters", () => {
      const testUrl = "http://localhost:5173/";
      const params = oauthService.extractAuthParams(testUrl);
      
      expect(params.code).toBeUndefined();
      expect(params.state).toBeUndefined();
      expect(params.error).toBeUndefined();
    });
  });

  describe("exchangeCodeForToken", () => {
    beforeEach(() => {
      // globalのfetchをモック
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should throw error when state is not found and format is invalid", async () => {
      await expect(
        oauthService.exchangeCodeForToken("test-code", "invalid-state")
      ).rejects.toThrow("Invalid state parameter: Invalid format");
    });

    it("should accept valid UUID format state when saved state is missing", async () => {
      const validState = "550e8400-e29b-41d4-a716-446655440000";
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "test-token",
          token_type: "Bearer",
        }),
      });

      const result = await oauthService.exchangeCodeForToken("test-code", validState);
      
      expect(result.accessToken).toBe("test-token");
      expect(result.tokenType).toBe("Bearer");
    });

    it("should throw error when state mismatch occurs", async () => {
      localStorage.setItem("oauth_state", "saved-state");
      
      await expect(
        oauthService.exchangeCodeForToken("test-code", "different-state")
      ).rejects.toThrow("Invalid state parameter: State mismatch");
    });

    it("should successfully exchange code for token with matching state", async () => {
      const validState = "550e8400-e29b-41d4-a716-446655440000";
      localStorage.setItem("oauth_state", validState);
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "test-access-token",
          token_type: "Bearer",
        }),
      });

      const result = await oauthService.exchangeCodeForToken("test-code", validState);
      
      expect(result.accessToken).toBe("test-access-token");
      expect(result.tokenType).toBe("Bearer");
      expect(localStorage.getItem("todoist_token")).toBe("test-access-token");
    });

    it("should clear oauth_state from both storages after exchange", async () => {
      const validState = "550e8400-e29b-41d4-a716-446655440000";
      localStorage.setItem("oauth_state", validState);
      sessionStorage.setItem("oauth_state", validState);
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "test-token",
          token_type: "Bearer",
        }),
      });

      await oauthService.exchangeCodeForToken("test-code", validState);
      
      expect(localStorage.getItem("oauth_state")).toBeNull();
      expect(sessionStorage.getItem("oauth_state")).toBeNull();
    });

    it("should throw error when HTTP request fails", async () => {
      const validState = "550e8400-e29b-41d4-a716-446655440000";
      localStorage.setItem("oauth_state", validState);
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      await expect(
        oauthService.exchangeCodeForToken("test-code", validState)
      ).rejects.toThrow("Failed to exchange code for token");
    });
  });

  describe("getStoredToken", () => {
    it("should return null when no token is stored", () => {
      expect(oauthService.getStoredToken()).toBeNull();
    });

    it("should return stored token", () => {
      localStorage.setItem("todoist_token", "test-token");
      expect(oauthService.getStoredToken()).toBe("test-token");
    });
  });

  describe("isTokenValid", () => {
    it("should return false when no token exists", () => {
      expect(oauthService.isTokenValid()).toBe(false);
    });

    it("should return true when token exists without expiration", () => {
      localStorage.setItem("todoist_token", "test-token");
      expect(oauthService.isTokenValid()).toBe(true);
    });

    it("should return false when token is expired", () => {
      localStorage.setItem("todoist_token", "test-token");
      localStorage.setItem("todoist_token_expires_at", String(Date.now() - 1000));
      expect(oauthService.isTokenValid()).toBe(false);
    });

    it("should return true when token is not expired", () => {
      localStorage.setItem("todoist_token", "test-token");
      localStorage.setItem("todoist_token_expires_at", String(Date.now() + 10000));
      expect(oauthService.isTokenValid()).toBe(true);
    });
  });

  describe("clearAuth", () => {
    it("should clear all authentication data from localStorage and sessionStorage", () => {
      localStorage.setItem("todoist_token", "test-token");
      localStorage.setItem("todoist_refresh_token", "refresh-token");
      localStorage.setItem("todoist_token_expires_at", "12345");
      localStorage.setItem("oauth_state", "state");
      sessionStorage.setItem("oauth_state", "state");

      oauthService.clearAuth();

      expect(localStorage.getItem("todoist_token")).toBeNull();
      expect(localStorage.getItem("todoist_refresh_token")).toBeNull();
      expect(localStorage.getItem("todoist_token_expires_at")).toBeNull();
      expect(localStorage.getItem("oauth_state")).toBeNull();
      expect(sessionStorage.getItem("oauth_state")).toBeNull();
    });
  });
});
