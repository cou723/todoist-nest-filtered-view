/**
 * AuthContext - アプリケーション全体の認証状態管理
 *
 * Todoist access_token を直接入力する方式の認証を提供します。
 */

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	token: string | null;
	login: (token: string) => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "todoist_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState<string | null>(null);

	// 起動時に localStorage からトークンを読み込み
	useEffect(() => {
		const savedToken = localStorage.getItem(TOKEN_KEY);
		if (savedToken) {
			setToken(savedToken);
			setIsAuthenticated(true);
		}
		setIsLoading(false);
	}, []);

	const login = (newToken: string) => {
		localStorage.setItem(TOKEN_KEY, newToken);
		setToken(newToken);
		setIsAuthenticated(true);
	};

	const logout = () => {
		localStorage.removeItem(TOKEN_KEY);
		// OAuth state keys も削除（将来の互換性のため）
		localStorage.removeItem("oauth_state");
		sessionStorage.removeItem("oauth_state");
		setToken(null);
		setIsAuthenticated(false);
	};

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, isLoading, token, login, logout }}
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
