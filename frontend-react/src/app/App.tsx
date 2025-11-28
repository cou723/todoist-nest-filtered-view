import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

// Mantine CSS は index.css で読み込む
import "@mantine/core/styles.css";
import { OAuthServiceLive } from "../features/auth/___infrastructure/oAuthService";
import { AuthProvider } from "../features/auth/___ui/AuthContext";
import { Router } from "./router";
import { getEnvImpl as getEnv } from "../features/env/___infrastructure";
import { useMemo } from "react";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

export function App() {
	const {
		VITE_TODOIST_CLIENT_ID: clientId,
		VITE_TODOIST_REDIRECT_URI: redirectUri,
	} = useMemo(() => getEnv(), []);

	const oauthServiceLive = useMemo(
		() =>
			new OAuthServiceLive(
				{ clientId, redirectUri, permissions: ["data:read", "task:add"] },
				localStorage,
				sessionStorage,
			),
		[clientId, redirectUri],
	);

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<AuthProvider oauthService={oauthServiceLive}>
					<BrowserRouter>
						<Router />
					</BrowserRouter>
				</AuthProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}
