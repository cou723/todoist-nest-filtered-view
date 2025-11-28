import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

// Mantine CSS は index.css で読み込む
import "@mantine/core/styles.css";
import { Router } from "./router";
import { AuthProvider } from "../features/auth/___ui/AuthContext";
import { OAuthServiceLive } from "../features/auth/___infrastructure/oAuthService";
import { useEnv } from "../features/env/__application";

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
	} = useEnv();

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<AuthProvider
					oauthService={
						new OAuthServiceLive(
							{ clientId, redirectUri, permissions: ["data:read", "task:add"] },
							localStorage,
							sessionStorage,
						)
					}
				>
					<BrowserRouter>
						<Router />
					</BrowserRouter>
				</AuthProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}
