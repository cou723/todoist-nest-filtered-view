import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { setProxyRpcBaseUrl } from "../__application/apiClient";
import type { OAuthService } from "../__application/oAuthService";
import { useEnv } from "../../env/__application";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	token: string | null;
	authError: string | null;
	startOAuth: () => void;
	completeOAuth: (params: { code?: string; state?: string }) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({
	children,
	oauthService,
}: {
	children: React.ReactNode;
	oauthService: OAuthService;
}) {
	const { VITE_PROXY_URL: proxyUrl } = useEnv();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState<string | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);

	useEffect(() => {
		setProxyRpcBaseUrl(proxyUrl);
	}, [proxyUrl]);

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
