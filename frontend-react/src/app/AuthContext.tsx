import type { Permission } from "@doist/todoist-api-typescript";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { OAuthService } from "../shared/todoist/OAuthService";
import { setProxyRpcBaseUrl } from "../shared/rpc/client";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	token: string | null;
	authError: string | null;
	startOAuth: () => void;
	completeOAuth: (params: { code?: string; state?: string }) => Promise<void>;
	loginWithToken: (token: string) => void;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "todoist_token";

const DEFAULT_PERMISSIONS: Permission[] = ["data:read", "task:add"];
const requireEnv = (key: keyof ImportMetaEnv): string => {
	const value = import.meta.env[key];
	if (!value || String(value).trim() === "") {
		throw new Error(`Environment variable ${key} is required`);
	}
	return String(value);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState<string | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);

	const clientId = requireEnv("VITE_TODOIST_CLIENT_ID");
	const redirectUri = requireEnv("VITE_TODOIST_REDIRECT_URI");
	const proxyUrl = requireEnv("VITE_PROXY_URL");
	setProxyRpcBaseUrl(proxyUrl);

	const oauthConfig = useMemo(
		() => ({
			clientId,
			redirectUri,
			permissions: DEFAULT_PERMISSIONS,
		}),
		[clientId, redirectUri],
	);

	const oauthService = useMemo(
		() => new OAuthService(oauthConfig),
		[oauthConfig],
	);

	useEffect(() => {
		const savedToken = oauthService.getStoredToken();
		if (savedToken) {
			setToken(savedToken);
			setIsAuthenticated(true);
		}
		setIsLoading(false);
	}, [oauthService]);

	const startOAuth = useCallback(() => {
		setAuthError(null);
		oauthService.redirectToAuthorize();
	}, [oauthService]);

	const loginWithToken = useCallback((newToken: string) => {
		localStorage.setItem(TOKEN_KEY, newToken);
		setToken(newToken);
		setIsAuthenticated(true);
		setAuthError(null);
	}, []);

	const completeOAuth = useCallback(
		async ({ code, state }: { code?: string; state?: string }) => {
			if (!code) {
				setAuthError("code パラメータが見つかりません");
				return;
			}
			setIsLoading(true);
			setAuthError(null);

			try {
				const result = await oauthService.exchangeCodeForToken(code, state);
				setToken(result.accessToken);
				setIsAuthenticated(true);
			} catch (error) {
				console.error("[Auth] トークン交換失敗", error);
				setAuthError(
					error instanceof Error ? error.message : "トークン交換に失敗しました",
				);
				oauthService.clearToken();
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		},
		[oauthService],
	);

	const logout = useCallback(async () => {
		if (!token) {
			setIsAuthenticated(false);
			return;
		}

		setIsLoading(true);
		setAuthError(null);
		try {
			await oauthService.revokeToken(token);
		} catch (error) {
			console.warn("[Auth] トークン無効化に失敗しました", error);
		} finally {
			oauthService.clearToken();
			oauthService.clearState();
			setToken(null);
			setIsAuthenticated(false);
			setIsLoading(false);
		}
	}, [oauthService, token]);

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isLoading,
				authError,
				token,
				startOAuth,
				completeOAuth,
				loginWithToken,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
