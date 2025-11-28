import { Cause, Effect, Exit } from "effect";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { logout as logoutUseCase } from "../__application/usecases/logout";
import { handleOAuthCallback } from "../__application/usecases/handleOAuthCallback";
import { startOAuth as startOAuthUseCase } from "../__application/usecases/startOAuth";
import type { OAuthService } from "../__application/oAuthService";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	token: string | null;
	authError: string | null;
	startOAuth: () => void;
	processOAuthCallback: (href: string) => void;
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
	const navigate = useNavigate();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState<string | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);

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
		startOAuthUseCase({
			oauthService,
			redirect: navigate,
		});
	}, [oauthService, navigate]);

	const completeOAuth = useCallback(
		async ({ code, state }: { code: string; state: string }) => {
			setIsLoading(true);
			setAuthError(null);
			await Effect.runPromise(
				oauthService
					.getToken(code, state)
					.pipe(Effect.tap((result) => setToken(result.accessToken)))
					.pipe(Effect.tap(() => setIsAuthenticated(true)))
					.pipe(
						Effect.mapError((error) => {
							console.error("[Auth] トークン交換失敗", error);
							setAuthError(error.message);
							oauthService.clearToken();
							setIsAuthenticated(false);
						}),
					),
			);
			setIsLoading(false);
		},
		[oauthService],
	);

	const processOAuthCallback = useCallback(
		(href: string) => {
			Effect.runSync(
				handleOAuthCallback(href, oauthService).pipe(
					Effect.tap(completeOAuth),
					Effect.mapError((e) => {
						setAuthError(e.message);
						setIsAuthenticated(false);
					}),
				),
			);
		},
		[completeOAuth, oauthService],
	);

	const logout = useCallback(async () => {
		setIsLoading(true);
		setAuthError(null);
		try {
			await Effect.runPromise(
				logoutUseCase({
					oauthService,
					token,
				}),
			);
		} catch (error) {
			console.warn("[Auth] トークン無効化に失敗しました", error);
		} finally {
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
				processOAuthCallback,
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
