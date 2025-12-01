import type { TodoistRequestError } from "@doist/todoist-api-typescript";
import type { Effect } from "effect";
import type { Task } from "@/features/tasks/domain";

export interface TaskRepository {
	getAll(filter: string): Effect.Effect<Task[], TodoistRequestError>;
	complete(id: string): Effect.Effect<void, TodoistRequestError>;
}
