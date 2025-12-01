import type { MantineColor } from "@mantine/core";
import { differenceInCalendarDays, startOfDay } from "date-fns";

export type DeadlineDisplay = {
	label: string;
	color: MantineColor;
};

export const formatDeadlineDisplay = (
	deadline: Date,
	today: Date = new Date(),
): DeadlineDisplay => {
	const base = startOfDay(today);
	const target = startOfDay(deadline);
	const diffDays = differenceInCalendarDays(target, base);

	if (diffDays < 0) {
		return { label: `${Math.abs(diffDays)}日前`, color: "red" };
	}

	if (diffDays === 0) {
		return { label: "今日", color: "yellow" };
	}

	if (diffDays <= 3) {
		return { label: `あと${diffDays}日`, color: "blue" };
	}

	if (diffDays <= 7) {
		return { label: `あと${diffDays}日`, color: "teal" };
	}

	return { label: `あと${diffDays}日`, color: "gray" };
};
