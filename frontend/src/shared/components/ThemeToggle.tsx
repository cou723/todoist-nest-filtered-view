import { ActionIcon } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<ActionIcon
			variant="default"
			size="lg"
			onClick={toggleTheme}
			aria-label="Toggle theme"
			data-testid="theme-toggle"
		>
			{theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
		</ActionIcon>
	);
}
