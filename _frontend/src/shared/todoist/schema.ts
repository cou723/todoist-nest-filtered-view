/**
 * Todoist Domain Schemas
 * 
 * Defines all Todoist-related domain types using Effect Schema for runtime validation
 * and type safety.
 */

import { Schema } from "effect";

/**
 * Task Due Date Schema
 */
export const DueSchema = Schema.Struct({
  date: Schema.String,
  isRecurring: Schema.Boolean,
  datetime: Schema.optional(Schema.String),
  string: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String),
});

export type Due = typeof DueSchema.Type;

/**
 * Duration Schema
 */
export const DurationSchema = Schema.Struct({
  amount: Schema.Number,
  unit: Schema.Literal("minute", "day"),
});

export type Duration = typeof DurationSchema.Type;

/**
 * Task Schema
 */
export const TaskSchema = Schema.Struct({
  id: Schema.String,
  projectId: Schema.String,
  sectionId: Schema.optional(Schema.NullOr(Schema.String)),
  content: Schema.String,
  description: Schema.String,
  isCompleted: Schema.Boolean,
  labels: Schema.Array(Schema.String),
  parentId: Schema.optional(Schema.NullOr(Schema.String)),
  order: Schema.Number,
  priority: Schema.Number,
  due: Schema.optional(Schema.NullOr(DueSchema)),
  url: Schema.String,
  commentCount: Schema.Number,
  createdAt: Schema.String,
  creatorId: Schema.String,
  assigneeId: Schema.optional(Schema.NullOr(Schema.String)),
  assignerId: Schema.optional(Schema.NullOr(Schema.String)),
  duration: Schema.optional(Schema.NullOr(DurationSchema)),
});

export type Task = typeof TaskSchema.Type;

/**
 * Task with pagination response
 */
export const GetTasksResponseSchema = Schema.Struct({
  results: Schema.Array(TaskSchema),
  nextCursor: Schema.NullOr(Schema.String),
});

export type GetTasksResponse = typeof GetTasksResponseSchema.Type;

/**
 * Label Schema
 */
export const LabelSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  color: Schema.String,
  order: Schema.Number,
  isFavorite: Schema.Boolean,
});

export type Label = typeof LabelSchema.Type;

/**
 * Completed Task Item Schema (from Sync API v1)
 */
export const CompletedTaskItemSchema = Schema.Struct({
  id: Schema.String,
  content: Schema.String,
  completed_at: Schema.String,
  project_id: Schema.String,
  user_id: Schema.String,
});

export type CompletedTaskItem = typeof CompletedTaskItemSchema.Type;

/**
 * Completed Tasks Response Schema
 */
export const CompletedTasksResponseSchema = Schema.Struct({
  items: Schema.Array(CompletedTaskItemSchema),
  next_cursor: Schema.NullOr(Schema.String),
});

export type CompletedTasksResponse = typeof CompletedTasksResponseSchema.Type;

/**
 * OAuth Token Response Schema
 */
export const OAuthTokenResponseSchema = Schema.Struct({
  access_token: Schema.String,
  token_type: Schema.String,
});

export type OAuthTokenResponse = typeof OAuthTokenResponseSchema.Type;

/**
 * Daily Completion Statistics Schema
 */
export const DailyCompletionStatSchema = Schema.Struct({
  date: Schema.String, // yyyy-MM-dd format
  count: Schema.Number,
  displayDate: Schema.String, // M/d format
});

export type DailyCompletionStat = typeof DailyCompletionStatSchema.Type;

/**
 * Today Task Statistics Schema
 */
export const TodayTaskStatSchema = Schema.Struct({
  date: Schema.String, // yyyy-MM-dd format
  completedCount: Schema.Number,
  displayDate: Schema.String, // M/d format
});

export type TodayTaskStat = typeof TodayTaskStatSchema.Type;

/**
 * Goal Statistics Schema
 */
export const GoalStatsSchema = Schema.Struct({
  totalGoals: Schema.Number,
  nonMilestoneGoals: Schema.Number,
  milestoneRate: Schema.Number, // percentage
});

export type GoalStats = typeof GoalStatsSchema.Type;
