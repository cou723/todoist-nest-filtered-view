/**
 * Schema Tests
 *
 * Tests for Todoist domain schemas and utility functions.
 */

import { Schema as S } from "@effect/schema";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { TaskNode } from "../schema";
import {
	CompletedTask,
	DailyCompletionStat,
	DueDate,
	extractLabelsFromContent,
	hasDependencyLabel,
	isDailyTask,
	isGoalTask,
	isMilestoneTask,
	isNonMilestoneGoal,
	isWorkTask,
	Task,
	TodayTaskStat,
} from "../schema";

describe("Schema Validation", () => {
	describe("Task Schema", () => {
		it("should validate a valid task", async () => {
			const validTask = {
				id: "123",
				projectId: "456",
				content: "Test task",
				description: "",
				isCompleted: false,
				labels: ["task"],
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=123",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "789",
			};

			const decoded = await Effect.runPromise(S.decodeUnknown(Task)(validTask));

			expect(decoded.id).toBe("123");
			expect(decoded.content).toBe("Test task");
			expect(decoded.labels).toEqual(["task"]);
		});

		it("should fail validation for invalid task", async () => {
			const invalidTask = {
				id: 123, // Should be string
				content: "Test",
			};

			await expect(
				Effect.runPromise(S.decodeUnknown(Task)(invalidTask)),
			).rejects.toThrow();
		});

		it("should validate task with optional fields", async () => {
			const taskWithDue = {
				id: "123",
				projectId: "456",
				content: "Test task",
				description: "",
				isCompleted: false,
				labels: ["task"],
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=123",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "789",
				due: {
					date: "2024-12-31",
					string: "Dec 31",
					lang: "en",
					isRecurring: false,
				},
			};

			const decoded = await Effect.runPromise(
				S.decodeUnknown(Task)(taskWithDue),
			);

			expect(decoded.due?.date).toBe("2024-12-31");
		});
	});

	describe("DueDate Schema", () => {
		it("should validate a valid due date", async () => {
			const validDueDate = {
				date: "2024-12-31",
				string: "Dec 31",
				lang: "en",
				isRecurring: false,
			};

			const decoded = await Effect.runPromise(
				S.decodeUnknown(DueDate)(validDueDate),
			);

			expect(decoded.date).toBe("2024-12-31");
			expect(decoded.isRecurring).toBe(false);
		});
	});

	describe("TaskNode Type", () => {
		it("should support task node with parent", () => {
			const taskWithParent: TaskNode = {
				id: "child",
				projectId: "456",
				content: "Child task",
				description: "",
				isCompleted: false,
				labels: ["task"],
				parentId: "parent",
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=child",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "789",
				parent: {
					id: "parent",
					projectId: "456",
					content: "Parent task",
					description: "",
					isCompleted: false,
					labels: ["goal"],
					order: 1,
					priority: 1,
					url: "https://todoist.com/showTask?id=parent",
					commentCount: 0,
					createdAt: "2024-01-01T00:00:00Z",
					creatorId: "789",
				},
			};

			expect(taskWithParent.id).toBe("child");
			expect(taskWithParent.parent?.id).toBe("parent");
		});
	});

	describe("CompletedTask Schema", () => {
		it("should validate a valid completed task", async () => {
			const validCompletedTask = {
				id: "123",
				completedAt: "2024-01-01T12:00:00Z",
				content: "Completed task @task",
				projectId: "456",
				userId: "789",
				labels: ["task"],
			};

			const decoded = await Effect.runPromise(
				S.decodeUnknown(CompletedTask)(validCompletedTask),
			);

			expect(decoded.id).toBe("123");
			expect(decoded.labels).toEqual(["task"]);
		});
	});

	describe("DailyCompletionStat Schema", () => {
		it("should validate valid daily stats", async () => {
			const validStat = {
				date: "2024-01-01",
				count: 5,
				displayDate: "1/1",
			};

			const decoded = await Effect.runPromise(
				S.decodeUnknown(DailyCompletionStat)(validStat),
			);

			expect(decoded.count).toBe(5);
		});

		it("should fail for negative count", async () => {
			const invalidStat = {
				date: "2024-01-01",
				count: -1,
				displayDate: "1/1",
			};

			await expect(
				Effect.runPromise(S.decodeUnknown(DailyCompletionStat)(invalidStat)),
			).rejects.toThrow();
		});
	});

	describe("TodayTaskStat Schema", () => {
		it("should validate valid today stats", async () => {
			const validStat = {
				date: "2024-01-01",
				completedCount: 3,
				displayDate: "1/1",
			};

			const decoded = await Effect.runPromise(
				S.decodeUnknown(TodayTaskStat)(validStat),
			);

			expect(decoded.completedCount).toBe(3);
		});
	});
});

describe("Utility Functions", () => {
	describe("extractLabelsFromContent", () => {
		it("should extract single label", () => {
			const labels = extractLabelsFromContent("This is a @task");
			expect(labels).toEqual(["task"]);
		});

		it("should extract multiple labels", () => {
			const labels = extractLabelsFromContent("@task @goal @important");
			expect(labels).toEqual(["task", "goal", "important"]);
		});

		it("should extract Japanese labels", () => {
			const labels = extractLabelsFromContent("@毎日のタスク @task");
			expect(labels).toEqual(["毎日のタスク", "task"]);
		});

		it("should return empty array for no labels", () => {
			const labels = extractLabelsFromContent("No labels here");
			expect(labels).toEqual([]);
		});

		it("should not extract labels within words", () => {
			const labels = extractLabelsFromContent("email@example.com @task");
			expect(labels).toEqual(["example.com", "task"]);
		});
	});

	describe("isGoalTask", () => {
		it("should return true for task with goal label", () => {
			const task = new Task({
				id: "1",
				projectId: "2",
				content: "Goal",
				description: "",
				isCompleted: false,
				labels: ["goal"],
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=1",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "3",
			});

			expect(isGoalTask(task)).toBe(true);
		});

		it("should return false for task without goal label", () => {
			const task = new Task({
				id: "1",
				projectId: "2",
				content: "Task",
				description: "",
				isCompleted: false,
				labels: ["task"],
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=1",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "3",
			});

			expect(isGoalTask(task)).toBe(false);
		});
	});

	describe("isNonMilestoneGoal", () => {
		it("should return true for goal with non-milestone label", () => {
			const task = new Task({
				id: "1",
				projectId: "2",
				content: "Goal",
				description: "",
				isCompleted: false,
				labels: ["goal", "non-milestone"],
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=1",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "3",
			});

			expect(isNonMilestoneGoal(task)).toBe(true);
		});

		it("should return false for goal without non-milestone label", () => {
			const task = new Task({
				id: "1",
				projectId: "2",
				content: "Goal",
				description: "",
				isCompleted: false,
				labels: ["goal"],
				order: 1,
				priority: 1,
				url: "https://todoist.com/showTask?id=1",
				commentCount: 0,
				createdAt: "2024-01-01T00:00:00Z",
				creatorId: "3",
			});

			expect(isNonMilestoneGoal(task)).toBe(false);
		});
	});

	describe("isWorkTask", () => {
		it("should return true for task with task label", () => {
			const task = new CompletedTask({
				id: "1",
				completedAt: "2024-01-01T12:00:00Z",
				content: "Work",
				projectId: "2",
				userId: "3",
				labels: ["task"],
			});

			expect(isWorkTask(task)).toBe(true);
		});

		it("should return false for task without task label", () => {
			const task = new CompletedTask({
				id: "1",
				completedAt: "2024-01-01T12:00:00Z",
				content: "Other",
				projectId: "2",
				userId: "3",
				labels: ["other"],
			});

			expect(isWorkTask(task)).toBe(false);
		});
	});

	describe("isDailyTask", () => {
		it("should return true for task with daily label", () => {
			const task = new CompletedTask({
				id: "1",
				completedAt: "2024-01-01T12:00:00Z",
				content: "Daily",
				projectId: "2",
				userId: "3",
				labels: ["毎日のタスク"],
			});

			expect(isDailyTask(task)).toBe(true);
		});

		it("should return false for task without daily label", () => {
			const task = new CompletedTask({
				id: "1",
				completedAt: "2024-01-01T12:00:00Z",
				content: "Other",
				projectId: "2",
				userId: "3",
				labels: ["task"],
			});

			expect(isDailyTask(task)).toBe(false);
		});
	});

	describe("isMilestoneTask", () => {
		it("should return true for milestone content", () => {
			expect(isMilestoneTask("プロジェクトAのマイルストーンを置く")).toBe(true);
		});

		it("should return false for non-milestone content", () => {
			expect(isMilestoneTask("プロジェクトA")).toBe(false);
		});
	});

	describe("hasDependencyLabel", () => {
		it("should return true for labels with dep- prefix", () => {
			expect(hasDependencyLabel(["dep-project-a", "task"])).toBe(true);
		});

		it("should return false for labels without dep- prefix", () => {
			expect(hasDependencyLabel(["task", "goal"])).toBe(false);
		});

		it("should return false for empty labels", () => {
			expect(hasDependencyLabel([])).toBe(false);
		});
	});
});
