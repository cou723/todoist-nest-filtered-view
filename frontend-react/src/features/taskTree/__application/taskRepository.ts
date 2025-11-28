import { Effect } from "effect";
import type { Task } from "../_domain/task";
import {
	TodoistApi,
	TodoistRequestError,
	type Task as TodoistTask,
} from "@doist/todoist-api-typescript";


export interface TaskRepository {
	getAll(filter: string): Effect.Effect<Task[], TodoistRequestError>;
}
