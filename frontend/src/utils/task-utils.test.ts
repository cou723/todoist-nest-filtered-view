import { describe, it, expect } from "vitest";
import {
  getPriorityText,
  sortTasksByPriority,
  formatDueDate,
  getDueDateUrgency,
} from "./task-utils.js";
import type { TaskNode } from "../types/task.js";
import { format } from "date-fns";

describe("getPriorityText", () => {
  it("returns correct text for each priority", () => {
    expect(getPriorityText(4)).toBe("緊急/重要");
    expect(getPriorityText(3)).toBe("不急/重要");
    expect(getPriorityText(2)).toBe("緊急/些末");
    expect(getPriorityText(1)).toBe("不急/些末");
    expect(getPriorityText(0)).toBe("不急/些末"); // default case
  });
});

describe("sortTasksByPriority", () => {
  it("sorts tasks by priority descending", () => {
    const tasks = [
      { priority: 1 },
      { priority: 4 },
      { priority: 2 },
      { priority: 3 },
    ];
    const sorted = sortTasksByPriority(tasks as TaskNode[]);
    expect(sorted.map((t) => t.priority)).toEqual([4, 3, 2, 1]);
  });
});

describe("formatDueDate", () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  it("returns '今日' if due date is today", () => {
    expect(formatDueDate({ date: format(today, 'yyyy-MM-dd') })).toBe("今日");
  });

  it("returns '明日' if due date is tomorrow", () => {
    expect(formatDueDate({ date: format(tomorrow, 'yyyy-MM-dd') })).toBe("明日");
  });

  it("returns 'X日前' if due date is in the past", () => {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 3);
    expect(formatDueDate({ date: format(pastDate, 'yyyy-MM-dd') })).toBe("3日前");
  });

  it("returns 'X日後' if due date is within 7 days in the future", () => {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);
    expect(formatDueDate({ date: format(futureDate, 'yyyy-MM-dd') })).toBe("4日後");
  });

  it("returns formatted date if due date is more than 7 days in the future", () => {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    const formatted = futureDate.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
    expect(formatDueDate({ date: format(futureDate, 'yyyy-MM-dd') })).toBe(formatted);
  });
});

describe("getDueDateUrgency", () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  it("returns 'overdue' if due date is before today", () => {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 1);
    expect(getDueDateUrgency({ date: format(pastDate, 'yyyy-MM-dd') })).toBe("overdue");
  });

  it("returns 'today' if due date is today", () => {
    expect(getDueDateUrgency({ date: format(today, 'yyyy-MM-dd') })).toBe("today");
  });

  it("returns 'tomorrow' if due date is tomorrow", () => {
    expect(getDueDateUrgency({ date: format(tomorrow, 'yyyy-MM-dd') })).toBe(
      "tomorrow"
    );
  });

  it("returns 'soon' if due date is within 3 days after tomorrow", () => {
    const soonDate = new Date(today);
    soonDate.setDate(today.getDate() + 3);
    expect(getDueDateUrgency({ date: format(soonDate, 'yyyy-MM-dd') })).toBe("soon");
  });

  it("returns 'normal' if due date is more than 3 days after tomorrow", () => {
    const normalDate = new Date(today);
    normalDate.setDate(today.getDate() + 5);
    expect(getDueDateUrgency({ date: format(normalDate, 'yyyy-MM-dd') })).toBe(
      "normal"
    );
  });
});
