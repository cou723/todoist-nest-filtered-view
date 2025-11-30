import { describe, expect, it } from "vitest";
import { formatDeadlineDisplay } from "@/features/tasks/___ui/AppShell/dated-goals/deadlineDisplay";

const baseDate = new Date(2024, 0, 10); // 2024-01-10 local midnight

describe("formatDeadlineDisplay", () => {
	it("過去日は「◯日前」かつ red", () => {
		const result = formatDeadlineDisplay(new Date(2024, 0, 8), baseDate);
		expect(result).toEqual({ label: "2日前", color: "red" });
	});

	it("当日は「今日」かつ yellow", () => {
		const result = formatDeadlineDisplay(new Date(2024, 0, 10), baseDate);
		expect(result).toEqual({ label: "今日", color: "yellow" });
	});

	it("3日以内は blue、7日以内は teal、それ以降は gray", () => {
		expect(formatDeadlineDisplay(new Date(2024, 0, 12), baseDate)).toEqual({
			label: "あと2日",
			color: "blue",
		});

		expect(formatDeadlineDisplay(new Date(2024, 0, 15), baseDate)).toEqual({
			label: "あと5日",
			color: "teal",
		});

		expect(formatDeadlineDisplay(new Date(2024, 0, 25), baseDate)).toEqual({
			label: "あと15日",
			color: "gray",
		});
	});
});
