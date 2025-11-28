import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";

// Mantine CSS は index.css で読み込む
import "@mantine/core/styles.css";
import { useMemo } from "react";
import { OAuthServiceLive } from "../features/auth/___infrastructure/oAuthService";
import { AuthProvider } from "../features/auth/___ui/AuthContext";
import { getEnvImpl as getEnv } from "../features/env/___infrastructure";
import { Router } from "./router";

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
		<MantineProvider>
			<BrowserRouter>
				<AuthProvider oauthService={oauthServiceLive}>
					<Router />
				</AuthProvider>
			</BrowserRouter>
		</MantineProvider>
	);
}
