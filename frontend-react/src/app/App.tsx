import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { BrowserRouter } from "react-router-dom";

// Mantine CSS は index.css で読み込む
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { useMemo } from "react";
import { Router } from "@/app/router";
import { OAuthServiceLive } from "@/features/auth/infrastructure/oAuthService";
import { AuthProvider } from "@/features/auth/ui/AuthContext";
import { getEnvImpl as getEnv } from "@/features/env/infrastructure";

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
			<Notifications />
			<BrowserRouter>
				<AuthProvider oauthService={oauthServiceLive}>
					<Router />
				</AuthProvider>
			</BrowserRouter>
		</MantineProvider>
	);
}
