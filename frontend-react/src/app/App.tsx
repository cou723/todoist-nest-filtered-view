import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./AppShell";
import { AuthProvider } from "./AuthContext";

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

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<AuthProvider>
					<AppShell />
				</AuthProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}
