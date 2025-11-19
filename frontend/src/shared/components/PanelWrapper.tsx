import { Paper, type PaperProps, Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface PanelWrapperProps extends Omit<PaperProps, "children"> {
	children: ReactNode;
	"data-testid"?: string;
}

/**
 * Common wrapper for all panel components
 * Provides consistent styling and layout structure
 */
export function PanelWrapper({
	children,
	"data-testid": dataTestId,
	...paperProps
}: PanelWrapperProps) {
	return (
		<Paper
			p="md"
			withBorder
			shadow="sm"
			h="100%"
			data-testid={dataTestId}
			{...paperProps}
		>
			<Stack gap="md">{children}</Stack>
		</Paper>
	);
}
