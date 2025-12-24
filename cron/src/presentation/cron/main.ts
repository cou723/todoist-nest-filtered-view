import { Effect } from "effect";
import {  TodoistApi } from "todoist";
import { TodoistTodoRepository } from "../../infrastructure/todoist/repository/todoist-todo.repository.ts";
import { ManageMilestonesUseCase } from "../../application/usecase/manage-milestones.usecase.ts";
import { ManageDependencyLabelsUseCase } from "../../application/usecase/manage-dependency-labels.usecase.ts";


export async function runCronJob() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log(`[${new Date().toISOString()}] Starting cron job...`);

    const api = new TodoistApi(token);
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

    console.log(
      `[${new Date().toISOString()}] Cron job completed successfully`,
    );
  } catch (error) {
    console.error("Error in cron job:", error);
    // Cron job should not crash the process, but log the error
  }
}
