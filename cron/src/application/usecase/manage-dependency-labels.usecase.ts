import { Effect, Option } from "effect";
import { ITodoRepository } from "../../domain/repository/todo-repository.interface.ts";
import { TodoLabel } from "../../domain/model/todo/todo-label.ts";

export class ManageDependencyLabelsUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  execute(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("=== Manage Dependency Labels Automation Started ===");

      yield* this.generateDepLabelsForGoals();
      yield* this.cleanupUnusedDepLabels();

      yield* Effect.log(
        "=== Manage Dependency Labels Automation Completed ===",
      );
    });
  }

  private generateDepLabelsForGoals(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("--- Generating Dependency Labels for Goals ---");

      const todos = yield* this.todoRepository.getAll();
      const goalTodos = todos.filterByLabel("goal").getAll();

      const effects = goalTodos.map((todo) => {
        let parentName: string | undefined;
        if (todo.parentId) {
          const parentTodo = todos.getById(todo.parentId);
          if (parentTodo) {
            parentName = parentTodo.content;
          }
        }

        const label = TodoLabel.createDependencyLabel(todo.content, parentName);

        return this.todoRepository.createLabel(label).pipe(
          Effect.map((optLabel) => Option.isSome(optLabel) ? 1 : 0),
          Effect.catchAll((error) =>
            Effect.logError(`Failed to create label ${label}: ${error}`).pipe(
              Effect.map(() => 0),
            )
          ),
          Effect.map((created) => ({
            created,
            skipped: created === 0 ? 1 : 0,
          })),
        );
      });

      const results = yield* Effect.all(effects, { concurrency: 2 }); // APIサーバーに負荷をかけすぎないように
      const createdCount = results.reduce(
        (sum, current) => sum + current.created,
        0,
      );
      const skippedCount = results.reduce(
        (sum, current) => sum + current.skipped,
        0,
      );

      if (createdCount > 0) {
        yield* Effect.log(`✓ Created ${createdCount} new dependency labels.`);
      }
      if (skippedCount > 0) {
        yield* Effect.log(
          `ℹ️ Skipped creating ${skippedCount} existing dependency labels.`,
        );
      }
      if (createdCount === 0 && skippedCount === 0) {
        yield* Effect.log("No dependency labels created or skipped.");
      }
    });
  }

  private cleanupUnusedDepLabels(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("--- Cleaning up Unused Dependency Labels ---");

      const todos = yield* this.todoRepository.getAll();
      const goalTodos = todos.filterByLabel("goal").getAll();

      const requiredLabelNames = new Set<string>();
      for (const todo of goalTodos) {
        let parentName: string | undefined;
        if (todo.parentId) {
          const parentTodo = todos.getById(todo.parentId);
          if (parentTodo) {
            parentName = parentTodo.content;
          }
        }
        const label = TodoLabel.createDependencyLabel(todo.content, parentName);
        requiredLabelNames.add(label);
      }

      const allLabels = yield* this.todoRepository.getLabels();
      const depLabels = allLabels.filter((l) => l.isDependencyLabel());

      const effects = depLabels.map((label) => {
        if (!requiredLabelNames.has(label.title)) {
          return this.todoRepository.deleteLabel(label.title).pipe(
            Effect.map(() => ({ deleted: 1, failed: 0 })),
            Effect.catchAll((error) =>
              Effect.logError(`Failed to delete label ${label.title}: ${error}`)
                .pipe(
                  Effect.map(() => ({ deleted: 0, failed: 1 })),
                )
            ),
          );
        }
        return Effect.succeed({ deleted: 0, failed: 0 });
      });

      const results = yield* Effect.all(effects, { concurrency: 2 }); // APIサーバーに負荷をかけすぎないように
      const deletedCount = results.reduce(
        (sum, current) => sum + current.deleted,
        0,
      );
      const failedCount = results.reduce(
        (sum, current) => sum + current.failed,
        0,
      );

      if (deletedCount > 0) {
        yield* Effect.log(
          `✓ Deleted ${deletedCount} unnecessary dependency labels.`,
        );
      }
      if (failedCount > 0) {
        yield* Effect.log(
          `✗ Failed to delete ${failedCount} dependency labels.`,
        );
      }
      if (deletedCount === 0 && failedCount === 0) {
        yield* Effect.log("No unnecessary dependency labels deleted.");
      }
    });
  }
}
