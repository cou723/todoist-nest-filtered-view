import type { TaskWithParent } from "../types/task.js";

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
 * タスクを優先順位順にソートする
 * 優先順位4（緊急/重要）が最上位、1（不急/些末）が最下位
 */
export function sortTasksByPriority(tasks: TaskWithParent[]): TaskWithParent[] {
  return [...tasks].sort((a, b) => {
    // 優先順位の数値が大きいほど重要度が高い
    return b.priority - a.priority;
  });
}

/**
 * 期限を日本語形式でフォーマットする
 */
export function formatDueDate(due: any): string {
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
    return `${diffDays}日後`;
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

  if (dueDate < today) {
    return "overdue";
  }

  if (isSameDate(dueDate, today)) {
    return "today";
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
