/**
 * Todoist ドメインスキーマ
 *
 * @effect/schema を使用した型安全なバリデーションのための Todoist ドメイン型を定義します。
 * これらのスキーマは Todoist REST API v2 のレスポンス構造に対応しています。
 */

import { Schema as S } from "@effect/schema";

/**
 * タスクの期限日情報
 */
export class DueDate extends S.Class<DueDate>("DueDate")({
	date: S.String, // YYYY-MM-DD 形式の日付
	string: S.String, // 人間が読める日付文字列
	lang: S.String, // 言語コード（例: "ja"）
	isRecurring: S.Boolean,
	datetime: S.optional(S.NullOr(S.String)), // タスクに時刻がある場合の完全な日時
	timezone: S.optional(S.NullOr(S.String)),
}) {}

/**
 * タスクの所要時間情報
 */
export class Duration extends S.Class<Duration>("Duration")({
	amount: S.Number,
	unit: S.Literal("minute", "day"),
}) {}

/**
 * Todoist タスク（Todo）
 * Todoist REST API から取得されるタスクを表します
 */
export class Task extends S.Class<Task>("Task")({
	id: S.String,
	projectId: S.String,
	sectionId: S.optional(S.NullOr(S.String)),
	content: S.String,
	description: S.String,
	isCompleted: S.Boolean,
	labels: S.Array(S.String),
	parentId: S.optional(S.NullOr(S.String)),
	order: S.Number,
	priority: S.Number, // 1-4 (1=通常, 4=緊急)
	due: S.optional(S.NullOr(DueDate)),
	url: S.String,
	commentCount: S.Number,
	createdAt: S.String, // ISO 8601 日時
	creatorId: S.String,
	assigneeId: S.optional(S.NullOr(S.String)),
	assignerId: S.optional(S.NullOr(S.String)),
	duration: S.optional(S.NullOr(Duration)),
}) {}

/**
 * 親階層を含むタスク
 * 再帰的な親情報を含む拡張タスク型
 */
export interface TaskNode extends Task {
	parent?: TaskNode;
}

/**
 * タスクのページネーションレスポンス
 */
export class TasksResponse extends S.Class<TasksResponse>("TasksResponse")({
	results: S.Array(Task),
	nextCursor: S.optional(S.NullOr(S.String)),
}) {}

/**
 * API からのタスクレスポンス（配列または���グネーション）
 */
export const TasksApiResponse = S.Union(S.Array(Task), TasksResponse);

/**
 * v1 Completed API からの完了済みタスク
 */
export class CompletedTask extends S.Class<CompletedTask>("CompletedTask")({
	id: S.String,
	completedAt: S.String, // ISO 8601 日時
	content: S.String,
	projectId: S.String,
	userId: S.String,
	// 注: labels は API から提供されないため、content から抽出します
	labels: S.Array(S.String),
}) {}

/**
 * 完了済みタスク API レスポンス（生データ）
 */
export const CompletedTasksApiResponse = S.Struct({
	items: S.optional(
		S.Array(
			S.Struct({
				id: S.String,
				completed_at: S.String,
				content: S.String,
				project_id: S.String,
				user_id: S.String,
			}),
		),
	),
	next_cursor: S.optional(S.NullOr(S.String)),
});

/**
 * 完了済みタスクのページネーションレスポンス
 */
export class CompletedTasksResponse extends S.Class<CompletedTasksResponse>(
	"CompletedTasksResponse",
)({
	items: S.Array(
		S.Struct({
			id: S.String,
			completed_at: S.String,
			content: S.String,
			project_id: S.String,
			user_id: S.String,
		}),
	),
	nextCursor: S.optional(S.NullOr(S.String)),
}) {}

export class DailyCompletionStat extends S.Class<DailyCompletionStat>(
	"DailyCompletionStat",
)({
	date: S.String, // YYYY-MM-DD 形式
	count: S.Number.pipe(S.nonNegative()),
	displayDate: S.String, // ローカライズされた表示文字列（例: "11/17"）
}) {}

export class TodayTaskStat extends S.Class<TodayTaskStat>("TodayTaskStat")({
	date: S.String, // YYYY-MM-DD 形式
	completedCount: S.Number.pipe(S.nonNegative()),
	displayDate: S.String, // ローカライズされた表示文字列
}) {}

export class TodoistProject extends S.Class<TodoistProject>("TodoistProject")({
	id: S.String,
	name: S.String,
	color: S.String,
	parentId: S.optional(S.NullOr(S.String)),
	order: S.Number,
	commentCount: S.Number,
	isShared: S.Boolean,
	isFavorite: S.Boolean,
	isInboxProject: S.Boolean,
	isTeamInbox: S.Boolean,
	viewStyle: S.Literal("list", "board"),
	url: S.String,
}) {}

export const isGoalTask = (task: Task): boolean => {
	return task.labels.includes("goal");
};

export const isNonMilestoneGoal = (task: Task): boolean => {
	return task.labels.includes("goal") && task.labels.includes("non-milestone");
};

export const isWorkTask = (task: Task | CompletedTask): boolean => {
	return task.labels.includes("task");
};

export const isDailyTask = (task: Task | CompletedTask): boolean => {
	return task.labels.includes("毎日のタスク");
};

export const isMilestoneTask = (content: string): boolean => {
	return /のマイルストーンを置く$/.test(content);
};

export const hasDependencyLabel = (labels: readonly string[]): boolean => {
	return labels.some((label) => label.startsWith("dep-"));
};

export const extractLabelsFromContent = (content: string): string[] => {
	const labelRegex = /@([^\s@]+)/gu;
	const labels: string[] = [];

	let match = labelRegex.exec(content);
	while (match !== null) {
		labels.push(match[1]);
		match = labelRegex.exec(content);
	}

	return labels;
};
