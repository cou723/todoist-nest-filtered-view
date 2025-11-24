import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { OAuthCallback } from "../features/auth/OAuthCallback";
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
					<BrowserRouter>
						<Routes>
							<Route path="/callback" element={<OAuthCallback />} />
							<Route path="/*" element={<AppShell />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</BrowserRouter>
				</AuthProvider>
			</MantineProvider>
		</QueryClientProvider>
	);
}
