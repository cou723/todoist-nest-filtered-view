import { useMantineColorScheme } from "@mantine/core";
import { useEffect } from "react";

/**
 * Hook to manage theme state using Mantine's official useMantineColorScheme
 * This syncs with localStorage and system preferences automatically
 * Reference: https://mantine.dev/theming/color-schemes/
 */
export function useTheme() {
	const { colorScheme, setColorScheme, toggleColorScheme } =
		useMantineColorScheme();

	useEffect(() => {
		// Sync data-theme attribute for custom CSS that may reference it
		document.documentElement.dataset.theme = colorScheme;
	}, [colorScheme]);

	return {
		theme: colorScheme,
		setTheme: setColorScheme,
		toggleTheme: toggleColorScheme,
	};
}
