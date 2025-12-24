import { Effect, Either } from "effect";
import { ITodoRepository } from "../../domain/repository/todo-repository.interface.ts";
import { TodoLabel } from "../../domain/model/todo/todo-label.ts";

export class ManageMilestonesUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  execute(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("=== マイルストーン自動化処理 開始 ===");

      yield* this.assignNonMilestoneLabelToGoals();
      yield* this.createMilestoneTodosForGoals();
      yield* this.cleanupNonMilestoneLabels();

      yield* Effect.log("=== マイルストーン自動化処理 完了 ===");
    });
  }

  public assignNonMilestoneLabelToGoals(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("--- ゴールタスクへの非マイルストーンラベル付与 ---");

      const todos = yield* this.todoRepository.getAll();
      const leafGoalTodos = todos.findLeafGoalTodos();

      const addingLabelEffects = leafGoalTodos.map((todo) => {
        const nonMilestoneLabel = new TodoLabel("non-milestone");
        todo.addLabel(nonMilestoneLabel);
        return this.todoRepository.update(todo).pipe(
          Effect.as(1),
          Effect.catchAll((error) =>
            Effect.logError(
              `"${todo.content}" への非マイルストーンラベル付与に失敗しました: ${error}`,
            ).pipe(
              Effect.map(() => 0),
            )
          ),
        );
      });

      const addingLabelResults = yield* Effect.all(addingLabelEffects, {
        concurrency: 2,
      });
      const assignedCount = addingLabelResults.reduce(
        (sum, current) => sum + current,
        0,
      );

      if (assignedCount > 0) {
        yield* Effect.log(
          `✓ ${assignedCount} 件のゴールタスクに非マイルストーンラベルを付与しました`,
        );
      } else {
        yield* Effect.log(
          "非マイルストーンラベルを付与するゴールタスクはありませんでした。",
        );
      }
    });
  }

  public createMilestoneTodosForGoals(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("--- ゴールタスクのマイルストーンTodo作成 ---");

      const todos = yield* this.todoRepository.getAll();
      const nonMilestoneGoalTodos = todos.filterByLabel("goal").filterByLabel(
        "non-milestone",
      ).getAll();

      const effects = nonMilestoneGoalTodos.map((goalTodo) => {
        const validation = todos.canMilestoneCreation(goalTodo);
        return Either.match(validation, {
          onLeft: (reason) =>
            Effect.log(
              `"${goalTodo.content}" のマイルストーンTodo作成をスキップします: ${reason}`,
            ).pipe(
              Effect.map(() => ({ created: 0, skipped: 1 })),
            ),
          onRight: () =>
            this.todoRepository.create(
              `${goalTodo.content}のマイルストーンを置く`,
              goalTodo.id,
            ).pipe(
              Effect.tapError((error) =>
                Effect.logError(
                  `"${goalTodo.content}" のマイルストーンTodo作成に失敗しました: ${error}`,
                )
              ),
              Effect.map(() => ({ created: 1, skipped: 0 })),
              Effect.catchAll(() => Effect.succeed({ created: 0, skipped: 0 })), // Error caught in tapError, return safe default
            ),
        });
      });

      const results = yield* Effect.all(effects, { concurrency: 2 });

      const createdCount = results.reduce(
        (sum, current) => sum + current.created,
        0,
      );
      const skippedCount = results.reduce(
        (sum, current) => sum + current.skipped,
        0,
      );

      if (createdCount > 0) {
        yield* Effect.log(
          `✓ ${createdCount} 件のマイルストーンTodoを作成しました`,
        );
      }
      if (skippedCount > 0) {
        yield* Effect.log(
          `ℹ️ ${skippedCount} 件のマイルストーンTodo作成をスキップしました。`,
        );
      }
      if (createdCount === 0 && skippedCount === 0) {
        yield* Effect.log(
          "マイルストーンTodoの作成、スキップはありませんでした。",
        );
      }
    });
  }

  public cleanupNonMilestoneLabels(): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* Effect.log("--- 非マイルストーンラベルのクリーンアップ ---");

      const todos = yield* this.todoRepository.getAll();
      const todosToCleanup = todos.findNonMilestoneParentTodos();

      const effects = todosToCleanup.map((todo) => {
        todo.removeLabel("non-milestone");
        return this.todoRepository.update(todo).pipe(
          Effect.as(1),
          Effect.catchAll((error) =>
            Effect.logError(
              `"${todo.content}" の非マイルストーンラベル処理に失敗しました: ${error}`,
            ).pipe(
              Effect.map(() => 0),
            )
          ),
        );
      });

      const results = yield* Effect.all(effects, { concurrency: 2 });
      const processedCount = results.reduce((sum, current) => sum + current, 0);

      if (processedCount > 0) {
        yield* Effect.log(
          `✓ ${processedCount} 件の非マイルストーンTodoを処理しました`,
        );
      } else {
        yield* Effect.log("処理する非マイルストーンTodoはありませんでした。");
      }
    });
  }
}
