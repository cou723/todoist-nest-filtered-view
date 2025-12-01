import { Cause, Effect } from "effect";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type { OAuthService } from "@/features/auth/application";
import {
	handleOAuthCallback,
	logout as logoutUseCase,
	startOAuth as startOAuthUseCase,
} from "@/features/auth/application";

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
		({
			code,
			state,
		}: {
			code: string;
			state: string;
		}): Effect.Effect<void, Error> => {
			return Effect.gen(function* () {
				const token = yield* oauthService.getToken(code, state).pipe(
					Effect.tapErrorCause((cause) =>
						Effect.sync(() => {
							const message = Cause.isFailType(cause)
								? cause.error.message
								: "プロキシに接続できませんでした";
							setAuthError(message);
							oauthService.clearToken();
							setIsAuthenticated(false);
						}),
					),
				);
				setToken(token.accessToken);
				setIsAuthenticated(true);
			});
		},
		[oauthService],
	);

	const processOAuthCallback = useCallback(
		(href: string) => {
			setIsLoading(true);
			setAuthError(null);
			void Effect.runPromise(
				Effect.gen(function* () {
					const result = yield* handleOAuthCallback(href, oauthService);
					yield* completeOAuth(result);
				}).pipe(
					Effect.tapError((e) =>
						Effect.sync(() => {
							setAuthError(e.message);
							setIsAuthenticated(false);
						}),
					),
					Effect.ensuring(Effect.sync(() => setIsLoading(false))),
				),
			);
		},
		[completeOAuth, oauthService],
	);

	const logout = useCallback(async () => {
		setIsLoading(true);
		setAuthError(null);
		await Effect.runPromise(
			logoutUseCase({
				oauthService,
				token,
			}),
		)
			.catch((e) => {
				console.warn("[Auth] トークン無効化に失敗しました", e);
			})
			.finally(() => {
				setToken(null);
				setIsAuthenticated(false);
				setIsLoading(false);
			});
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
