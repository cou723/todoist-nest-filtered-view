import type { TaskNode } from "../types/task.js";
import { isToday, isTomorrow, differenceInDays, isBefore } from "date-fns";

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
 * タスクを優先順位順にソートする（階層式ソート）
 * 優先順位が同じ場合は、親タスクの階層における並び順でソートする
 */
export function sortTasksByPriority(tasks: TaskNode[]): TaskNode[] {
  return [...tasks].sort((a, b) => {
    // 優先順位が異なる場合は優先順位順
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // 優先順位が同じ場合は、階層を考慮したソート
    return compareTasksHierarchically(a, b);
  });
}

/**
 * 階層を考慮してタスクを比較する
 * 各階層レベルで親タスクの並び順を比較し、最終的に自身の並び順で比較する
 */
function compareTasksHierarchically(a: TaskNode, b: TaskNode): number {
  // 両方のタスクの祖先チェーンを構築
  const ancestorsA = buildAncestorChain(a);
  const ancestorsB = buildAncestorChain(b);
  
  // 共通の階層レベルまで比較
  const minLength = Math.min(ancestorsA.length, ancestorsB.length);
  
  for (let i = 0; i < minLength; i++) {
    const ancestorA = ancestorsA[i];
    const ancestorB = ancestorsB[i];
    
    // 同じ祖先の場合は次の階層へ
    if (ancestorA.id === ancestorB.id) {
      continue;
    }
    
    // 異なる祖先の場合は、その祖先同士の並び順で比較
    return ancestorA.order - ancestorB.order;
  }
  
  // 祖先が全て同じ場合、階層の深さが異なれば浅い方を先に
  if (ancestorsA.length !== ancestorsB.length) {
    return ancestorsA.length - ancestorsB.length;
  }
  
  // 同じ階層レベルの場合は、自身の並び順で比較
  return a.order - b.order;
}

/**
 * タスクの祖先チェーンを構築する（ルートから現在のタスクまで）
 */
function buildAncestorChain(task: TaskNode): TaskNode[] {
  const chain: TaskNode[] = [];
  let current = task.parent;
  
  while (current) {
    chain.unshift(current); // 先頭に追加（古い祖先が先頭）
    current = current.parent;
  }
  
  // 自分自身も追加
  chain.push(task);
  
  return chain;
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

  const dueDate = new Date(due.date + 'T00:00:00');

  // 今日の日付と比較
  if (isToday(dueDate)) {
    return "今日";
  }

  // 明日の日付と比較
  if (isTomorrow(dueDate)) {
    return "明日";
  }

  // 過去の日付かチェック
  if (isBefore(dueDate, new Date())) {
    const diffDays = Math.abs(differenceInDays(dueDate, new Date()));
    return `${diffDays}日前`;
  }

  // 未来の日付
  const diffDays = differenceInDays(dueDate, new Date());
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

  const dueDate = new Date(due.date + 'T00:00:00');

  if (isToday(dueDate)) {
    return "today";
  }

  if (isBefore(dueDate, new Date())) {
    return "overdue";
  }

  if (isTomorrow(dueDate)) {
    return "tomorrow";
  }

  const diffDays = differenceInDays(dueDate, new Date());
  if (diffDays <= 3) {
    return "soon";
  }

  return "normal";
}

