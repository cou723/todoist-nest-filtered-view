import { describe, it, expect } from "vitest";
import { Effect, Schema } from "effect";
import {
  TaskSchema,
  DueSchema,
  GetTasksResponseSchema,
  LabelSchema,
  CompletedTaskItemSchema,
  CompletedTasksResponseSchema,
  OAuthTokenResponseSchema,
  DailyCompletionStatSchema,
  TodayTaskStatSchema,
  GoalStatsSchema,
} from "../schema.js";

describe("Todoist Schema", () => {
  describe("DueSchema", () => {
    it("should validate a valid due date object", async () => {
      const validDue = {
        date: "2024-12-31",
        isRecurring: false,
        datetime: "2024-12-31T10:00:00Z",
        string: "Dec 31",
        timezone: "UTC",
      };

      const result = await Schema.decodeUnknown(DueSchema)(validDue).pipe(
        Effect.runPromise
      );

      expect(result).toEqual(validDue);
    });

    it("should validate a minimal due date object", async () => {
      const minimalDue = {
        date: "2024-12-31",
        isRecurring: false,
      };

      const result = await Schema.decodeUnknown(DueSchema)(minimalDue).pipe(
        Effect.runPromise
      );

      expect(result.date).toBe("2024-12-31");
      expect(result.isRecurring).toBe(false);
    });
  });

  describe("TaskSchema", () => {
    it("should validate a complete task object", async () => {
      const validTask = {
        id: "task_123",
        projectId: "project_456",
        sectionId: "section_789",
        content: "Test task @goal",
        description: "Task description",
        isCompleted: false,
        labels: ["goal", "task"],
        parentId: null,
        order: 1,
        priority: 4,
        due: {
          date: "2024-12-31",
          isRecurring: false,
        },
        url: "https://todoist.com/task/123",
        commentCount: 0,
        createdAt: "2024-01-01T00:00:00Z",
        creatorId: "user_123",
        assigneeId: null,
        assignerId: null,
        duration: null,
      };

      const result = await Schema.decodeUnknown(TaskSchema)(validTask).pipe(
        Effect.runPromise
      );

      expect(result.id).toBe("task_123");
      expect(result.content).toBe("Test task @goal");
      expect(result.labels).toContain("goal");
    });
  });

  describe("GetTasksResponseSchema", () => {
    it("should validate tasks response with pagination", async () => {
      const response = {
        results: [
          {
            id: "task_1",
            projectId: "proj_1",
            content: "Task 1",
            description: "",
            isCompleted: false,
            labels: ["task"],
            order: 1,
            priority: 1,
            url: "https://todoist.com/task/1",
            commentCount: 0,
            createdAt: "2024-01-01T00:00:00Z",
            creatorId: "user_1",
          },
        ],
        nextCursor: "cursor_abc",
      };

      const result = await Schema.decodeUnknown(GetTasksResponseSchema)(response).pipe(
        Effect.runPromise
      );

      expect(result.results).toHaveLength(1);
      expect(result.nextCursor).toBe("cursor_abc");
    });

    it("should validate tasks response without next cursor", async () => {
      const response = {
        results: [],
        nextCursor: null,
      };

      const result = await Schema.decodeUnknown(GetTasksResponseSchema)(response).pipe(
        Effect.runPromise
      );

      expect(result.results).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("LabelSchema", () => {
    it("should validate a label object", async () => {
      const label = {
        id: "label_123",
        name: "@goal",
        color: "blue",
        order: 1,
        isFavorite: false,
      };

      const result = await Schema.decodeUnknown(LabelSchema)(label).pipe(
        Effect.runPromise
      );

      expect(result.name).toBe("@goal");
      expect(result.color).toBe("blue");
    });
  });

  describe("CompletedTaskItemSchema", () => {
    it("should validate a completed task item", async () => {
      const item = {
        id: "task_123",
        content: "Completed task @task",
        completed_at: "2024-01-01T12:00:00Z",
        project_id: "project_456",
        user_id: "user_789",
      };

      const result = await Schema.decodeUnknown(CompletedTaskItemSchema)(item).pipe(
        Effect.runPromise
      );

      expect(result.id).toBe("task_123");
      expect(result.content).toContain("@task");
      expect(result.completed_at).toBe("2024-01-01T12:00:00Z");
    });
  });

  describe("CompletedTasksResponseSchema", () => {
    it("should validate completed tasks response", async () => {
      const response = {
        items: [
          {
            id: "task_1",
            content: "Task 1 @task",
            completed_at: "2024-01-01T12:00:00Z",
            project_id: "proj_1",
            user_id: "user_1",
          },
        ],
        next_cursor: null,
      };

      const result = await Schema.decodeUnknown(CompletedTasksResponseSchema)(response).pipe(
        Effect.runPromise
      );

      expect(result.items).toHaveLength(1);
      expect(result.next_cursor).toBeNull();
    });
  });

  describe("OAuthTokenResponseSchema", () => {
    it("should validate OAuth token response", async () => {
      const response = {
        access_token: "token_abc123",
        token_type: "Bearer",
      };

      const result = await Schema.decodeUnknown(OAuthTokenResponseSchema)(response).pipe(
        Effect.runPromise
      );

      expect(result.access_token).toBe("token_abc123");
      expect(result.token_type).toBe("Bearer");
    });
  });

  describe("DailyCompletionStatSchema", () => {
    it("should validate daily completion stat", async () => {
      const stat = {
        date: "2024-01-01",
        count: 5,
        displayDate: "1/1",
      };

      const result = await Schema.decodeUnknown(DailyCompletionStatSchema)(stat).pipe(
        Effect.runPromise
      );

      expect(result.date).toBe("2024-01-01");
      expect(result.count).toBe(5);
      expect(result.displayDate).toBe("1/1");
    });
  });

  describe("TodayTaskStatSchema", () => {
    it("should validate today task stat", async () => {
      const stat = {
        date: "2024-01-01",
        completedCount: 10,
        displayDate: "今日",
      };

      const result = await Schema.decodeUnknown(TodayTaskStatSchema)(stat).pipe(
        Effect.runPromise
      );

      expect(result.completedCount).toBe(10);
      expect(result.displayDate).toBe("今日");
    });
  });

  describe("GoalStatsSchema", () => {
    it("should validate goal statistics", async () => {
      const stats = {
        totalGoals: 20,
        nonMilestoneGoals: 5,
        milestoneRate: 75.0,
      };

      const result = await Schema.decodeUnknown(GoalStatsSchema)(stats).pipe(
        Effect.runPromise
      );

      expect(result.totalGoals).toBe(20);
      expect(result.nonMilestoneGoals).toBe(5);
      expect(result.milestoneRate).toBe(75.0);
    });
  });

  describe("Schema Validation Errors", () => {
    it("should reject invalid task object", async () => {
      const invalidTask = {
        id: "task_123",
        // Missing required fields
      };

      await expect(
        Schema.decodeUnknown(TaskSchema)(invalidTask).pipe(Effect.runPromise)
      ).rejects.toThrow();
    });

    it("should reject invalid OAuth response", async () => {
      const invalidResponse = {
        access_token: "token",
        // Missing token_type
      };

      await expect(
        Schema.decodeUnknown(OAuthTokenResponseSchema)(invalidResponse).pipe(
          Effect.runPromise
        )
      ).rejects.toThrow();
    });
  });
});
