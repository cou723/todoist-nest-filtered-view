import {
	TodoistApi,
	type TodoistRequestError,
	type Task as TodoistTask,
} from "@doist/todoist-api-typescript";
import type { Effect } from "effect";
import type { Task } from "../_domain/task";

export interface TaskRepository {
	getAll(filter: string): Effect.Effect<Task[], TodoistRequestError>;
}
