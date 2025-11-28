/**
 * Fixture data for mock TodoistHttpClient
 *
 * 成功ケースのみのモックデータを提供します。
 */

import type { Task } from "../todoist/schema";

/**
 * サンプルタスクデータ
 */
export const FIXTURE_TASKS: Task[] = [
	{
		id: "7495833149",
		projectId: "2203306141",
		content: "Sample Task @task",
		description: "",
		isCompleted: false,
		labels: ["task"],
		parentId: null,
		order: 1,
		priority: 1,
		due: null,
		url: "https://todoist.com/showTask?id=7495833149",
		commentCount: 0,
		createdAt: "2024-01-01T00:00:00Z",
		creatorId: "123456",
	},
	{
		id: "7495833150",
		projectId: "2203306141",
		content: "Goal Task @goal",
		description: "",
		isCompleted: false,
		labels: ["goal"],
		parentId: null,
		order: 2,
		priority: 1,
		due: {
			date: "2024-12-31",
			string: "Dec 31",
			lang: "en",
			isRecurring: false,
		},
		url: "https://todoist.com/showTask?id=7495833150",
		commentCount: 0,
		createdAt: "2024-01-01T00:00:00Z",
		creatorId: "123456",
	},
	{
		id: "7495833151",
		projectId: "2203306141",
		content: "Child Task @task",
		description: "",
		isCompleted: false,
		labels: ["task"],
		parentId: "7495833150",
		order: 1,
		priority: 1,
		due: null,
		url: "https://todoist.com/showTask?id=7495833151",
		commentCount: 0,
		createdAt: "2024-01-01T00:00:00Z",
		creatorId: "123456",
	},
];

/**
 * 完了済みタスクデータ
 */
export const FIXTURE_COMPLETED_TASKS = {
	items: [
		{
			id: "7495833152",
			completed_at: "2024-01-15T10:30:00Z",
			content: "Completed Task @task",
			project_id: "2203306141",
			user_id: "123456",
		},
		{
			id: "7495833153",
			completed_at: "2024-01-16T14:20:00Z",
			content: "プロジェクトAのマイルストーンを置く",
			project_id: "2203306141",
			user_id: "123456",
		},
		{
			id: "7495833154",
			completed_at: "2024-01-17T09:15:00Z",
			content: "Another Task @task",
			project_id: "2203306141",
			user_id: "123456",
		},
	],
	next_cursor: null,
};

/**
 * OAuth トークンレスポンス
 */
export const FIXTURE_OAUTH_TOKEN = {
	access_token: "mock_bearer_token_xyz123",
	token_type: "Bearer",
};
