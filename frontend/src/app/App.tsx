import { createTheme, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "../shared/hooks/useTheme";
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

const theme = createTheme({
	/** Customize theme here if needed */
});

export function App() {
	// Initialize theme on app mount
	const { theme: currentTheme } = useTheme();

	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider
				theme={theme}
				defaultColorScheme={currentTheme}
				forceColorScheme={currentTheme}
			>
				<AppShell />
			</MantineProvider>
		</QueryClientProvider>
	);
}
