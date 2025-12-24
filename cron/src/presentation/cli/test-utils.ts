import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Effect, Option } from "effect";

import { Todo } from "../../domain/model/todo/todo.ts";
import { TodoId } from "../../domain/model/todo/todo-id.ts";
import { TodoLabel } from "../../domain/model/todo/todo-label.ts";
import { TodoCollection } from "../../domain/model/todo/todo-collection.ts";
import { ITodoRepository } from "../../domain/repository/todo-repository.interface.ts";

export class MockTodoRepository implements ITodoRepository {
  private todos: Todo[] = [];
  private initialTodos: Map<string, Todo> = new Map();
  private nextId = 1;
  private labels: TodoLabel[] = [];

  setTodos(todos: Todo[]): void {
    this.todos = todos;
    this.initialTodos = new Map(
      todos.map((t) => [t.id.value, cloneTodo(t)]),
    );
  }

  assertUnchanged(id: string): void {
    const current = this.todos.find((t) => t.id.value === id);
    const initial = this.initialTodos.get(id);

    if (!current || !initial) {
      throw new Error(`Task ${id} not found in current or initial todos`);
    }

    assertEquals(current, initial, `Task ${id} should not have changed`);
  }

  assertContainsLabels(id: string, expectedLabels: string[]): void {
    const todo = this.todos.find((t) => t.id.value === id);
    if (!todo) {
      throw new Error(`Task ${id} not found in current todos`);
    }

    expectedLabels.forEach((label) => {
      assertEquals(
        todo.hasLabel(label),
        true,
        `Task ${id} should have label "${label}"`,
      );
    });
  }

  getTodos_mock(): Todo[] {
    return this.todos;
  }

  getLabels_mock(): TodoLabel[] {
    return this.labels;
  }

  assertMilestoneCreated(parentId: string, expectedContent: string): void {
    const milestoneTodos = this.todos.filter((t) =>
      t.content.includes("のマイルストーンを置く")
    );

    assertEquals(
      milestoneTodos.length,
      1,
      "A single milestone todo should have been created.",
    );
    assertEquals(
      milestoneTodos[0].parentId?.value,
      parentId,
      `Milestone todo parentId should be ${parentId}`,
    );
    assertEquals(
      milestoneTodos[0].content,
      expectedContent,
      `Milestone todo content should be "${expectedContent}"`,
    );
  }

  assertNoMilestoneCreated(): void {
    const milestoneTodos = this.todos.filter((t) =>
      t.content.includes("のマイルストーンを置く")
    );
    assertEquals(
      milestoneTodos.length,
      0,
      "No milestone todo should have been created.",
    );
  }

  getAll(): Effect.Effect<TodoCollection, Error> {
    return Effect.succeed(new TodoCollection(this.todos));
  }

  update(todo: Todo): Effect.Effect<void, Error> {
    return Effect.sync(() => {
      const index = this.todos.findIndex((t) => t.id.equals(todo.id));
      if (index !== -1) {
        this.todos[index] = todo;
      }
    });
  }

  create(content: string, parentId?: TodoId): Effect.Effect<Todo, Error> {
    return Effect.sync(() => {
      const newTodo = new Todo(
        new TodoId(this.nextId.toString()),
        content,
        [],
        parentId || null,
      );
      this.todos.push(newTodo);
      this.nextId++;
      return newTodo;
    });
  }

  delete(id: TodoId): Effect.Effect<void, Error> {
    return Effect.sync(() => {
      this.todos = this.todos.filter((t) => !t.id.equals(id));
    });
  }

  getLabels(): Effect.Effect<TodoLabel[], Error> {
    return Effect.succeed(this.labels);
  }

  createLabel(name: string): Effect.Effect<Option.Option<TodoLabel>, Error> {
    return Effect.sync(() => {
      const existing = this.labels.find((l) => l.title === name);
      if (existing) {
        return Option.none();
      }
      const newLabel = new TodoLabel(name);
      this.labels.push(newLabel);
      return Option.some(newLabel);
    });
  }

  deleteLabel(title: string): Effect.Effect<void, Error> {
    return Effect.succeed(
      this.labels = this.labels.filter((l) => l.title !== title),
    );
  }
}

// テスト用のタスクデータ作成関数
export function createTestTodo(
  id: string,
  content: string,
  labels: string[],
  parentId: string | null = null,
): Todo {
  return new Todo(
    new TodoId(id),
    content,
    labels.map((l) => new TodoLabel(l)),
    parentId ? new TodoId(parentId) : null,
  );
}

export function cloneTodo(todo: Todo): Todo {
  return new Todo(
    new TodoId(todo.id.value),
    todo.content,
    todo.labels.map((l) => new TodoLabel(l.title)),
    todo.parentId ? new TodoId(todo.parentId.value) : null,
  );
}
