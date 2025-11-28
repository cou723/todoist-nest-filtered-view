import { Effect } from "effect";
import type { Task } from "../_domain/task";
import {
	TodoistApi,
	TodoistRequestError,
	type Task as TodoistTask,
} from "@doist/todoist-api-typescript";
import type { TaskRepository } from "../__application/taskRepository";

const mapTodoistTaskToDomain = (task: TodoistTask): Task => ({
    id: task.id.toString(),
    summary: task.content,
    labels: task.labels,
    deadline: task.due ? new Date(task.due.date) : null,
    priority: task.priority,
    parentId: task.parentId ? task.parentId.toString() : null,
});

export class TaskRepositoryImpl implements TaskRepository {
	private todoistClient: TodoistApi;
	constructor(access_token: string) {
		this.todoistClient = new TodoistApi(access_token);
	}

	get(id: string): Effect.Effect<Task, TodoistRequestError> {
		return Effect.tryPromise({
			try: async () => {
				const task = await this.todoistClient.getTask(id);
				return mapTodoistTaskToDomain(task);
			},
			catch: (error) => {
				if (error instanceof TodoistRequestError) {
					return error;
				}
				throw error;
			},
		});
	}

	getAll(query: string): Effect.Effect<Task[], TodoistRequestError> {
		return Effect.tryPromise({
			try: async () => {
				let tasks: TodoistTask[] = [];
				let nextCursor: string | null = null;
				do {
					const response = await this.todoistClient.getTasksByFilter({
						query,
						cursor: nextCursor,
					});
					tasks = tasks.concat(response.results);
					nextCursor = response.nextCursor;
				} while (nextCursor);

				return tasks.map(mapTodoistTaskToDomain);
			},
			catch: (error) => {
				if (error instanceof TodoistRequestError) {
					return error;
				}
				throw error;
			},
		});
	}
}
