import type { TaskNode } from "../types/task.js";

export function getPriorityText(priority: number): string {
  switch (priority) {
    case 4:
      return "緊急/重要";
    case 3:
      return "不急/重要";
    case 2:
      return "緊急/些末";
    case 1:
    default:
      return "不急/些末";
  }
}


/**
 * タスクが他のタスクの親かどうかを判定する
 */
export function isParentTask(task: TaskNode, allTasks: TaskNode[]): boolean {
  return allTasks.some(t => t.parent?.id === task.id);
}

/**
 * 親タスクを除外し、子タスクと独立タスクのみを取得する
 */
export function filterChildAndIndependentTasks(tasks: TaskNode[]): TaskNode[] {
  return tasks.filter(task => !isParentTask(task, tasks));
}

/**
 * タスクを優先順位順にソートする
 * 1. 親タスクを除外（子タスクと独立タスクのみ表示）
 * 2. 優先度順（高い優先度が上）
 */
export function sortTasksByPriority(tasks: TaskNode[]): TaskNode[] {
  // まず親タスクを除外
  const childAndIndependentTasks = filterChildAndIndependentTasks(tasks);
  
  return [...childAndIndependentTasks].sort((a, b) => {
    // 優先度順（高い優先度が上）
    return b.priority - a.priority;
  });
}

/**
 * 期限を日本語形式でフォーマットする
 */
export function formatDueDate(due: {
  date: string;
  datetime?: string | null;
}): string {
  if (!due || !due.date) {
    return "";
  }

  const dueDate = new Date(due.date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // 今日の日付と比較
  if (isSameDate(dueDate, today)) {
    return "今日";
  }

  // 明日の日付と比較
  if (isSameDate(dueDate, tomorrow)) {
    return "明日";
  }

  // 過去の日付かチェック
  if (dueDate < today) {
    const diffDays = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${diffDays}日前`;
  }

  // 未来の日付
  const diffDays = Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 7) {
    return `${diffDays + 1}日後`;
  }

  // 1週間以上先の場合は日付を表示
  return dueDate.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 期限の緊急度を取得する（スタイリング用）
 */
export function getDueDateUrgency(due: {
  date: string;
  datetime?: string | null;
}): "overdue" | "today" | "tomorrow" | "soon" | "normal" {
  if (!due || !due.date) {
    return "normal";
  }

  const dueDate = new Date(due.date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDate(dueDate, today)) {
    return "today";
  }

  if (dueDate < today) {
    return "overdue";
  }

  if (isSameDate(dueDate, tomorrow)) {
    return "tomorrow";
  }

  const diffDays = Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 3) {
    return "soon";
  }

  return "normal";
}

/**
 * 2つの日付が同じ日かどうかを判定する
 */
function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
