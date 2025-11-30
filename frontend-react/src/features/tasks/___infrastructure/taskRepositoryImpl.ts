import {
	type GetTasksResponse,
	TodoistApi,
	TodoistRequestError,
	type Task as TodoistTask,
} from "@doist/todoist-api-typescript";
import { parseISO } from "date-fns";
import { Effect } from "effect";
import type { TaskRepository } from "@/features/tasks/__application/taskRepository";
import type { Task } from "@/features/tasks/_domain/task";

const mapTodoistTaskToDomain = (task: TodoistTask): Task => ({
	id: task.id.toString(),
	summary: task.content,
	labels: task.labels,
	deadline: task.due ? parseISO(task.due.date) : null,
	priority: task.priority,
	parentId: task.parentId ? task.parentId.toString() : null,
	order: task.childOrder,
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

	getAll(filter: string): Effect.Effect<Task[], TodoistRequestError> {
		return Effect.tryPromise({
			try: async () => {
				let tasks: TodoistTask[] = [];
				let nextCursor: string | null = null;
				do {
					const response: GetTasksResponse =
						filter.trim().length > 0
							? await this.todoistClient.getTasksByFilter({
									query: filter,
									cursor: nextCursor,
								})
							: await this.todoistClient.getTasks({
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

	complete(id: string): Effect.Effect<void, TodoistRequestError> {
		return Effect.tryPromise({
			try: async () => {
				await this.todoistClient.closeTask(id);
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
