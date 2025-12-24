import { Effect, Option } from "effect";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ManageMilestonesUseCase } from "./manage-milestones.usecase.ts";
import { ITodoRepository } from "../../domain/repository/todo-repository.interface.ts";
import { Todo } from "../../domain/model/todo/todo.ts";
import { TodoCollection } from "../../domain/model/todo/todo-collection.ts";
import { TodoId } from "../../domain/model/todo/todo-id.ts";
import { TodoLabel } from "../../domain/model/todo/todo-label.ts";

// Mock Repository
class MockTodoRepository implements ITodoRepository {
  private todos: Todo[] = [];
  private labels: TodoLabel[] = [];
  private nextId = 1;

  setTodos(todos: Todo[]) {
    this.todos = todos;
  }

  getAll(): Effect.Effect<TodoCollection, Error> {
    return Effect.succeed(new TodoCollection([...this.todos]));
  }

  update(todo: Todo): Effect.Effect<void, Error> {
    return Effect.sync(() => {
      const index = this.todos.findIndex(t => t.id.equals(todo.id));
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
        parentId || null
      );
      this.todos.push(newTodo);
      this.nextId++;
      return newTodo;
    });
  }

  delete(id: TodoId): Effect.Effect<void, Error> {
    return Effect.sync(() => {
      this.todos = this.todos.filter(t => !t.id.equals(id));
    });
  }

  getLabels(): Effect.Effect<TodoLabel[], Error> {
    return Effect.succeed([...this.labels]);
  }

  createLabel(name: string): Effect.Effect<Option.Option<TodoLabel>, Error> {
    return Effect.sync(() => {
      const label = new TodoLabel(name);
      this.labels.push(label);
      return Option.some(label);
    });
  }

  deleteLabel(name: string): Effect.Effect<void, Error> {
    return Effect.sync(() => {
      this.labels = this.labels.filter(l => l.title !== name);
    });
  }

  // Helper to access todos for assertion
  getTodosForTest(): Todo[] {
    return this.todos;
  }
}

// Test Data Helpers
function createTestTodo(id: string, content: string, labels: string[], parentId: string | null = null): Todo {
  return new Todo(
    new TodoId(id),
    content,
    labels.map(l => new TodoLabel(l)),
    parentId ? new TodoId(parentId) : null
  );
}

Deno.test("ManageMilestonesUseCase: Assign non-milestone to goals without children", async () => {
  const mockRepo = new MockTodoRepository();
  const useCase = new ManageMilestonesUseCase(mockRepo);

  const todos = [
    createTestTodo("1", "Goal without children", ["goal"]),
    createTestTodo("2", "Goal with task child", ["goal"]),
    createTestTodo("3", "Task child", ["task"], "2"),
    createTestTodo("4", "Goal with non-milestone", ["goal", "non-milestone"]),
  ];
  mockRepo.setTodos(todos);

  await Effect.runPromise(useCase.execute());

  const updatedTodos = mockRepo.getTodosForTest();
  const goal1 = updatedTodos.find(t => t.id.value === "1");
  const goal2 = updatedTodos.find(t => t.id.value === "2");
  const goal4 = updatedTodos.find(t => t.id.value === "4");

  assertEquals(goal1?.hasLabel("non-milestone"), true);
  assertEquals(goal2?.hasLabel("non-milestone"), false);
  assertEquals(goal4?.hasLabel("non-milestone"), true);
});

Deno.test("ManageMilestonesUseCase: Create milestone todo for non-milestone goals", async () => {
  const mockRepo = new MockTodoRepository();
  const useCase = new ManageMilestonesUseCase(mockRepo);

  const todos = [
    createTestTodo("1", "Goal with non-milestone", ["goal", "non-milestone"]),
  ];
  mockRepo.setTodos(todos);

  await Effect.runPromise(useCase.execute());

  const updatedTodos = mockRepo.getTodosForTest();
  const milestoneTodos = updatedTodos.filter(t => t.isMilestoneTodo());

  assertEquals(milestoneTodos.length, 1);
  assertEquals(milestoneTodos[0].parentId?.value, "1");
});

Deno.test("ManageMilestonesUseCase: Cleanup non-milestone from goals with children", async () => {
  const mockRepo = new MockTodoRepository();
  const useCase = new ManageMilestonesUseCase(mockRepo);

  const todos = [
    createTestTodo("1", "Goal with child now", ["goal", "non-milestone"]),
    createTestTodo("2", "New Child", ["task"], "1"),
  ];
  mockRepo.setTodos(todos);

  await Effect.runPromise(useCase.execute());

  const updatedTodos = mockRepo.getTodosForTest();
  const goal1 = updatedTodos.find(t => t.id.value === "1");

  assertEquals(goal1?.hasLabel("non-milestone"), false);
});