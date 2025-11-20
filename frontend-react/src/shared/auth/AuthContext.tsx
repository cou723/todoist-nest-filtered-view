/**
 * AuthContext - 認証状態を管理するReact Context
 */

import { Effect, Either } from "effect";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createProxyClient } from "../http/client";
import { AuthService, AuthServiceLive, type OAuthConfig } from "../todoist";

interface AuthContextValue {
	isAuthenticated: boolean;
	isProcessingAuth: boolean;
	authError: string | null;
	login: () => void;
	logout: () => void;
	handleOAuthCallback: (code: string, state: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
	config: OAuthConfig;
}

export function AuthProvider({ children, config }: AuthProviderProps) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isProcessingAuth, setIsProcessingAuth] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);

	// AuthService のレイヤーを作成（useMemoで安定化）
	const authLayer = useMemo(
		() => AuthServiceLive(config).pipe(Effect.provide(createProxyClient())),
		[config],
	);

	// 初期化時に認証状態をチェック
	useEffect(() => {
		const checkAuth = async () => {
			const result = await Effect.gen(function* () {
				const authService = yield* AuthService;
				return yield* authService.isAuthenticated();
			})
				.pipe(Effect.provide(authLayer), Effect.either)
				.pipe(Effect.runPromise);

			if (Either.isRight(result)) {
				setIsAuthenticated(result.right);
			}
		};

		checkAuth();
	}, [authLayer]);

	// ログイン処理
	const login = useCallback(() => {
		const runLogin = async () => {
			const result = await Effect.gen(function* () {
				const authService = yield* AuthService;
				return yield* authService.generateAuthUrl();
			})
				.pipe(Effect.provide(authLayer), Effect.either)
				.pipe(Effect.runPromise);

			if (Either.isRight(result)) {
				// OAuth 認可 URL にリダイレクト
				window.location.href = result.right.url;
			}
		};

		runLogin();
	}, [authLayer]);

	// OAuth コールバック処理
	const handleOAuthCallback = useCallback(
		async (code: string, state: string) => {
			setIsProcessingAuth(true);
			setAuthError(null);

			const result = await Effect.gen(function* () {
				const authService = yield* AuthService;
				return yield* authService.exchangeCode(code, state);
			})
				.pipe(Effect.provide(authLayer), Effect.either)
				.pipe(Effect.runPromise);

			if (Either.isRight(result)) {
				setIsAuthenticated(true);
				setAuthError(null);
			} else {
				const error = result.left;
				setAuthError(
					error._tag === "AuthError"
						? "認証に失敗しました。もう一度お試しください。"
						: `エラーが発生しました: ${error.message}`,
				);
			}

			setIsProcessingAuth(false);
		},
		[authLayer],
	);

	// ログアウト処理
	const logout = useCallback(() => {
		const runLogout = async () => {
			await Effect.gen(function* () {
				const authService = yield* AuthService;
				yield* authService.removeToken();
			})
				.pipe(Effect.provide(authLayer), Effect.either)
				.pipe(Effect.runPromise);

			setIsAuthenticated(false);
			setAuthError(null);
		};

		runLogout();
	}, [authLayer]);

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				isProcessingAuth,
				authError,
				login,
				logout,
				handleOAuthCallback,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
