import { Paper, type PaperProps } from "@mantine/core";
import type { ReactNode } from "react";

interface PanelWrapperProps extends Omit<PaperProps, "children"> {
	children: ReactNode;
	"data-testid"?: string;
}

/**
 * Common wrapper for all panel components
 * Provides consistent Paper styling
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
			{children}
		</Paper>
	);
}
