import { Effect } from "effect";
import { ITodoRepository } from "../../domain/repository/todo-repository.interface.ts";

export class RemoveMilestoneTodosUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  execute(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("=== Remove Milestone Todos Started ===");

      const todos = yield* this.todoRepository.getAll();
      const milestoneTodos = todos.findMilestoneTodos();

      yield* Effect.log(`Found ${milestoneTodos.length} milestone todos to remove`);

      const effects = milestoneTodos.map((todo) => {
        return this.todoRepository.delete(todo.id).pipe(
          Effect.map(() => ({ deleted: 1, failed: 0 })),
          Effect.catchAll((error) =>
            Effect.logError(`✗ Failed to remove todo: "${todo.content}": ${error}`).pipe(
              Effect.map(() => ({ deleted: 0, failed: 1 }))
            )
          )
        );
      });

      const results = yield* Effect.all(effects, { concurrency: 2 });
      const deletedCount = results.reduce((sum, current) => sum + current.deleted, 0);
      const failedCount = results.reduce((sum, current) => sum + current.failed, 0);

      if (deletedCount > 0) {
        yield* Effect.log(`✓ Removed ${deletedCount} milestone todos.`);
      }
      if (failedCount > 0) {
        yield* Effect.log(`✗ Failed to remove ${failedCount} milestone todos.`);
      }
      if (deletedCount === 0 && failedCount === 0) {
        yield* Effect.log("No milestone todos removed.");
      }

      yield* Effect.log("=== Remove Milestone Todos Completed ===");
    });
  }
}