import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

/**
 * Get the initial theme based on localStorage or system preference
 */
function getInitialTheme(): Theme {
	// Check localStorage first
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	// Fall back to system preference
	if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
		return "dark";
	}

	return "light";
}

/**
 * Hook to manage theme state with localStorage and system preference sync
 */
export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => {
		const initial = getInitialTheme();
		// Immediately apply the theme on first render
		document.documentElement.dataset.theme = initial;
		document.documentElement.setAttribute("data-mantine-color-scheme", initial);
		return initial;
	});

	useEffect(() => {
		// Apply theme to document element
		document.documentElement.dataset.theme = theme;

		// Apply Mantine color scheme by setting data-mantine-color-scheme
		document.documentElement.setAttribute("data-mantine-color-scheme", theme);

		// Save to localStorage
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "light" ? "dark" : "light"));
	};

	return { theme, setTheme, toggleTheme };
}
