import { Effect } from "effect";
import { TodoistApi } from "todoist";
import { TodoistTodoRepository } from "../../infrastructure/todoist/repository/todoist-todo.repository.ts";
import { RemoveMilestoneTodosUseCase } from "../../application/usecase/remove-milestone-todos.usecase.ts";

async function main() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log(`[${new Date().toISOString()}] Starting milestone todo removal...`);

    const api = new TodoistApi(token);
    const todoRepository = new TodoistTodoRepository(api);
    const useCase = new RemoveMilestoneTodosUseCase(todoRepository);

    await Effect.runPromise(useCase.execute());

    console.log(`[${new Date().toISOString()}] Milestone todo removal completed successfully`);
  } catch (error) {
    console.error("Error in milestone todo removal:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}