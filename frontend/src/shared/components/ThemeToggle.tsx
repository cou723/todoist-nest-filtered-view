import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ThemeToggle() {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();

	return (
		<ActionIcon
			variant="default"
			size="lg"
			onClick={toggleColorScheme}
			aria-label="Toggle theme"
			data-testid="theme-toggle"
		>
			{colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
		</ActionIcon>
	);
}
