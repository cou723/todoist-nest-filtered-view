import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../shared/auth";
import { AppShell } from "./AppShell";

// Mantine CSS は index.css で読み込む
import "@mantine/core/styles.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

// OAuth設定を環境変数から取得
const oauthConfig = {
	clientId: import.meta.env.VITE_TODOIST_CLIENT_ID || "",
	redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
	scope: "data:read_write,data:delete",
};

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<AuthProvider config={oauthConfig}>
					<AppShell />
				</AuthProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}
