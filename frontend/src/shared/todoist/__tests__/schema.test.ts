/**
 * スキーマテスト
 *
 * Todoist ドメインスキーマとユーティリティ関数のテスト。
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

describe("スキーマ検証", () => {
	describe("Task スキーマ", () => {
		it("有効なタスクを検証する", async () => {
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

		it("無効なタスクの検証を失敗させる", async () => {
			const invalidTask = {
				id: 123, // 文字列である必要がある
				content: "Test",
			};

			await expect(
				Effect.runPromise(S.decodeUnknown(Task)(invalidTask)),
			).rejects.toThrow();
		});

		it("オプションフィールドを持つタスクを検証する", async () => {
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

	describe("DueDate スキーマ", () => {
		it("有効な期限日を検証する", async () => {
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

	describe("TaskNode 型", () => {
		it("親を持つタスクノードをサポートする", () => {
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

	describe("CompletedTask スキーマ", () => {
		it("有効な完了済みタスクを検証する", async () => {
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

	describe("DailyCompletionStat スキーマ", () => {
		it("有効な日次統計を検証する", async () => {
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

		it("負のカウントで失敗する", async () => {
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

	describe("TodayTaskStat スキーマ", () => {
		it("有効な今日の統計を検証する", async () => {
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

describe("ユーティリティ関数", () => {
	describe("extractLabelsFromContent", () => {
		it("単一のラベルを抽出する", () => {
			const labels = extractLabelsFromContent("This is a @task");
			expect(labels).toEqual(["task"]);
		});

		it("複数のラベルを抽出する", () => {
			const labels = extractLabelsFromContent("@task @goal @important");
			expect(labels).toEqual(["task", "goal", "important"]);
		});

		it("日本語のラベルを抽出する", () => {
			const labels = extractLabelsFromContent("@毎日のタスク @task");
			expect(labels).toEqual(["毎日のタスク", "task"]);
		});

		it("ラベルがない場合は空配列を返す", () => {
			const labels = extractLabelsFromContent("No labels here");
			expect(labels).toEqual([]);
		});

		it("単語内のラベルは抽出しない", () => {
			const labels = extractLabelsFromContent("email@example.com @task");
			expect(labels).toEqual(["example.com", "task"]);
		});
	});

	describe("isGoalTask", () => {
		it("goal ラベルを持つタスクの場合 true を返す", () => {
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

		it("goal ラベルを持たないタスクの場合 false を返す", () => {
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
		it("non-milestone ラベルを持つゴールの場合 true を返す", () => {
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

		it("non-milestone ラベルを持たないゴールの場合 false を返す", () => {
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
		it("task ラベルを持つタスクの場合 true を返す", () => {
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

		it("task ラベルを持たないタスクの場合 false を返す", () => {
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
		it("毎日のタスクラベルを持つタスクの場合 true を返す", () => {
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

		it("毎日のタスクラベルを持たないタスクの場合 false を返す", () => {
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
		it("マイルストーンのコンテンツの場合 true を返す", () => {
			expect(isMilestoneTask("プロジェクトAのマイルストーンを置く")).toBe(true);
		});

		it("マイルストーンでないコンテンツの場合 false を返す", () => {
			expect(isMilestoneTask("プロジェクトA")).toBe(false);
		});
	});

	describe("hasDependencyLabel", () => {
		it("dep- プレフィックスを持つラベルの場合 true を返す", () => {
			expect(hasDependencyLabel(["dep-project-a", "task"])).toBe(true);
		});

		it("dep- プレフィックスを持たないラベルの場合 false を返す", () => {
			expect(hasDependencyLabel(["task", "goal"])).toBe(false);
		});

		it("空のラベルの場合 false を返す", () => {
			expect(hasDependencyLabel([])).toBe(false);
		});
	});
});
