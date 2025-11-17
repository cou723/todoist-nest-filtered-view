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
	timezone: S.optional(S.NullOr(S.String)), // タイムゾーン文字列
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

/**
 * 日次完了統計
 */
export class DailyCompletionStat extends S.Class<DailyCompletionStat>(
	"DailyCompletionStat",
)({
	date: S.String, // YYYY-MM-DD 形式
	count: S.Number.pipe(S.nonNegative()),
	displayDate: S.String, // ローカライズされた表示文字列（例: "11/17"）
}) {}

/**
 * 当日のタスク統計
 */
export class TodayTaskStat extends S.Class<TodayTaskStat>("TodayTaskStat")({
	date: S.String, // YYYY-MM-DD 形式
	completedCount: S.Number.pipe(S.nonNegative()),
	displayDate: S.String, // ローカライズされた表示文字列
}) {}

/**
 * Todoist プロジェクト
 */
export class Project extends S.Class<Project>("Project")({
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

/**
 * OAuth トークンレスポンス
 */
export class OAuthTokenResponse extends S.Class<OAuthTokenResponse>(
	"OAuthTokenResponse",
)({
	accessToken: S.String,
	tokenType: S.String,
}) {}

/**
 * ゴール関連の型
 */

/**
 * タスクがゴールかどうかを確認（@goal ラベルを持つ）
 */
export const isGoalTask = (task: Task): boolean => {
	return task.labels.includes("goal");
};

/**
 * タスクがマイルストーン未設定のゴールかどうかを確認（@goal と @non-milestone の両方のラベルを持つ）
 */
export const isNonMilestoneGoal = (task: Task): boolean => {
	return task.labels.includes("goal") && task.labels.includes("non-milestone");
};

/**
 * タスクが作業タスクかどうかを確認（@task ラベルを持つ）
 */
export const isWorkTask = (task: Task | CompletedTask): boolean => {
	return task.labels.includes("task");
};

/**
 * タスクが毎日のタスクかどうかを確認（@毎日のタスク ラベルを持つ）
 */
export const isDailyTask = (task: Task | CompletedTask): boolean => {
	return task.labels.includes("毎日のタスク");
};

/**
 * タスクがマイルストーンタスクかどうかを確認（コンテンツが「のマイルストーンを置く」で終わる）
 */
export const isMilestoneTask = (content: string): boolean => {
	return /のマイルストーンを置く$/.test(content);
};

/**
 * タスクまたはその祖先が依存関係ラベルを持つかどうかを確認（"dep-" で始まる）
 */
export const hasDependencyLabel = (labels: string[]): boolean => {
	return labels.some((label) => label.startsWith("dep-"));
};

/**
 * タスクコンテンツから @ プレフィックス付きラベルを抽出
 * 例: "@task @goal" -> ["task", "goal"]
 */
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
