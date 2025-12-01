import type { TodoistRequestError } from "@doist/todoist-api-typescript";
import { Effect } from "effect";
import type { TaskRepository } from "@/features/tasks/application";

interface CompleteTaskDeps {
	readonly taskRepository: Pick<TaskRepository, "complete">;
}

export function completeTask(
	taskId: string,
	{ taskRepository }: CompleteTaskDeps,
): Effect.Effect<void, TodoistRequestError> {
	return taskRepository
		.complete(taskId)
		.pipe(Effect.tapError((error) => Effect.logError(error)));
}
