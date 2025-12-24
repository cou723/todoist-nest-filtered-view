import { Effect } from "effect";
import { CustomFetch, TodoistApi } from "todoist";
import { ManageDependencyLabelsUseCase } from "../../application/usecase/manage-dependency-labels.usecase.ts";
import { TodoistTodoRepository } from "../../infrastructure/todoist/repository/todoist-todo.repository.ts";
import { createLoggingFetch } from "../../infrastructure/todoist/logging-fetch.ts";
import { ManageMilestonesUseCase } from "../../application/usecase/manage-milestones.usecase.ts";

async function debugRun() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log("=== Dependency Label Debug Run ===");
    console.log(`[${new Date().toISOString()}] Debug run started`);

    const loggingFetch: CustomFetch = createLoggingFetch();
    const api = new TodoistApi(token, { customFetch: loggingFetch });

    const todoRepository = new TodoistTodoRepository(api);

    const manageMilestonesUseCase = new ManageMilestonesUseCase(todoRepository);
    const manageDependencyLabelsUseCase = new ManageDependencyLabelsUseCase(
      todoRepository,
    );

    // Run use cases
    const program = Effect.all([
      manageMilestonesUseCase.execute(),
      manageDependencyLabelsUseCase.execute(),
    ]); // 直列にしないとバグる気がする
    await Effect.runPromise(program);
    console.log(`[${new Date().toISOString()}] Debug run completed`);
    console.log("=== Debug Run Finished ===");
  } catch (error) {
    console.error("Error in debug run:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await debugRun();
}
