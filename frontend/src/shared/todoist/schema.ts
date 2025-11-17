/**
 * Todoist Domain Schemas
 *
 * This file defines all Todoist domain types using @effect/schema for type-safe validation.
 * These schemas align with the Todoist REST API v2 response structure.
 */

import { Schema as S } from "@effect/schema";

/**
 * Due date information for a task
 */
export class DueDate extends S.Class<DueDate>("DueDate")({
	date: S.String, // Date in YYYY-MM-DD format
	string: S.String, // Human-readable date string
	lang: S.String, // Language code (e.g., "ja")
	isRecurring: S.Boolean,
	datetime: S.optional(S.NullOr(S.String)), // Full datetime if task has time component
	timezone: S.optional(S.NullOr(S.String)), // Timezone string
}) {}

/**
 * Duration information for a task
 */
export class Duration extends S.Class<Duration>("Duration")({
	amount: S.Number,
	unit: S.Literal("minute", "day"),
}) {}

/**
 * Todoist Task (Todo)
 * Represents a task from the Todoist REST API
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
	priority: S.Number, // 1-4 (1=normal, 4=urgent)
	due: S.optional(S.NullOr(DueDate)),
	url: S.String,
	commentCount: S.Number,
	createdAt: S.String, // ISO 8601 datetime
	creatorId: S.String,
	assigneeId: S.optional(S.NullOr(S.String)),
	assignerId: S.optional(S.NullOr(S.String)),
	duration: S.optional(S.NullOr(Duration)),
}) {}

/**
 * Task with parent hierarchy
 * Extended task type that includes recursive parent information
 */
export interface TaskNode extends Task {
	parent?: TaskNode;
}

/**
 * Paginated response for tasks
 */
export class TasksResponse extends S.Class<TasksResponse>("TasksResponse")({
	results: S.Array(Task),
	nextCursor: S.optional(S.NullOr(S.String)),
}) {}

/**
 * Completed task from the v1 Completed API
 */
export class CompletedTask extends S.Class<CompletedTask>("CompletedTask")({
	id: S.String,
	completedAt: S.String, // ISO 8601 datetime
	content: S.String,
	projectId: S.String,
	userId: S.String,
	// Note: labels are not provided by the API, we extract them from content
	labels: S.Array(S.String),
}) {}

/**
 * Paginated response for completed tasks
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
 * Daily completion statistics
 */
export class DailyCompletionStat extends S.Class<DailyCompletionStat>(
	"DailyCompletionStat",
)({
	date: S.String, // YYYY-MM-DD format
	count: S.Number.pipe(S.nonNegative()),
	displayDate: S.String, // Localized display string (e.g., "11/17")
}) {}

/**
 * Today's task statistics
 */
export class TodayTaskStat extends S.Class<TodayTaskStat>("TodayTaskStat")({
	date: S.String, // YYYY-MM-DD format
	completedCount: S.Number.pipe(S.nonNegative()),
	displayDate: S.String, // Localized display string
}) {}

/**
 * Todoist Project
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
 * OAuth token response
 */
export class OAuthTokenResponse extends S.Class<OAuthTokenResponse>(
	"OAuthTokenResponse",
)({
	accessToken: S.String,
	tokenType: S.String,
}) {}

/**
 * Goal-related types
 */

/**
 * Check if a task is a goal (has @goal label)
 */
export const isGoalTask = (task: Task): boolean => {
	return task.labels.includes("goal");
};

/**
 * Check if a task is a non-milestone goal (has both @goal and @non-milestone labels)
 */
export const isNonMilestoneGoal = (task: Task): boolean => {
	return task.labels.includes("goal") && task.labels.includes("non-milestone");
};

/**
 * Check if a task is a work task (has @task label)
 */
export const isWorkTask = (task: Task | CompletedTask): boolean => {
	return task.labels.includes("task");
};

/**
 * Check if a task is a daily task (has @毎日のタスク label)
 */
export const isDailyTask = (task: Task | CompletedTask): boolean => {
	return task.labels.includes("毎日のタスク");
};

/**
 * Check if a task is a milestone task (content ends with "のマイルストーンを置く")
 */
export const isMilestoneTask = (content: string): boolean => {
	return /のマイルストーンを置く$/.test(content);
};

/**
 * Check if a task or its ancestors have a dependency label (starts with "dep-")
 */
export const hasDependencyLabel = (labels: string[]): boolean => {
	return labels.some((label) => label.startsWith("dep-"));
};

/**
 * Extract @-prefixed labels from task content
 * Example: "@task @goal" -> ["task", "goal"]
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
