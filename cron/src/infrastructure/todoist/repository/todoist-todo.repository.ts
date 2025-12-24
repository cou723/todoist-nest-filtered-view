import { Effect, Option } from "effect";
import { TodoistApi } from "todoist";
import { ITodoRepository } from "../../../domain/repository/todo-repository.interface.ts";
import { Todo } from "../../../domain/model/todo/todo.ts";
import { TodoCollection } from "../../../domain/model/todo/todo-collection.ts";
import { TodoId } from "../../../domain/model/todo/todo-id.ts";
import { TodoLabel } from "../../../domain/model/todo/todo-label.ts";
import { TodoistTodoMapper } from "../mapper/todoist-todo.mapper.ts";

export class TodoistTodoRepository implements ITodoRepository {
  private todoCache = new Map<string, Todo[]>();
  private labelCache = new Map<string, TodoLabel[]>();
  private labelIdMap = new Map<string, string>(); // タイトル → ID のマッピング
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  constructor(private readonly api: TodoistApi) {}

  getAll(): Effect.Effect<TodoCollection, Error> {
    return Effect.tryPromise({
      try: async () => {
        const now = Date.now();
        const cacheKey = "all_todos";

        if (
          this.todoCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now
        ) {
          console.log("Using cached all todos");
          return new TodoCollection(this.todoCache.get(cacheKey)!);
        }

        const todos = await this.fetchAll();
        this.todoCache.set(cacheKey, todos);
        this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

        console.log(`Retrieved ${todos.length} todos from API`);
        return new TodoCollection(todos);
      },
      catch: (error) => new Error(String(error)),
    });
  }

  private async fetchAll() {
    const todos: Todo[] = [];
    let cursor: string | undefined = undefined;
    while (true) {
      console.log("Fetching todos with cursor:", cursor);
      const todoistTasks = await this.api.getTasks({ cursor });
      todos.push(...todoistTasks.results.map(TodoistTodoMapper.toDomain));
      if (todoistTasks.nextCursor == null) {
        break;
      }
      cursor = todoistTasks.nextCursor;
    }
    return todos;
  }

  update(todo: Todo): Effect.Effect<void, Error> {
    return Effect.tryPromise({
      try: async () => {
        const payload = TodoistTodoMapper.toUpdatePayload(todo);
        await this.api.updateTask(todo.id.value, payload);
        this.clearCache();
      },
      catch: (error) => new Error(String(error)),
    });
  }

  create(content: string, parentId?: TodoId): Effect.Effect<Todo, Error> {
    return Effect.tryPromise({
      try: async () => {
        const payload: { content: string; parentId?: string } = { content };
        if (parentId) {
          payload.parentId = parentId.value;
        }

        const newTask = await this.api.addTask(payload);
        this.clearCache();
        return TodoistTodoMapper.toDomain(newTask);
      },
      catch: (error) => new Error(String(error)),
    });
  }

  delete(id: TodoId): Effect.Effect<void, Error> {
    return Effect.tryPromise({
      try: async () => {
        await this.api.deleteTask(id.value);
        this.clearCache();
      },
      catch: (error) => new Error(String(error)),
    });
  }

  getLabels(): Effect.Effect<TodoLabel[], Error> {
    return Effect.tryPromise({
      try: async () => {
        const now = Date.now();
        const cacheKey = "all_labels";

        if (
          this.labelCache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now
        ) {
          console.log("Using cached labels");
          return this.labelCache.get(cacheKey)!;
        }

        const labels = await this.fetchAllLabels();

        this.labelCache.set(cacheKey, labels);
        this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

        console.log(`Retrieved ${labels.length} labels from API`);
        return labels;
      },
      catch: (error) => new Error(String(error)),
    });
  }

  private async fetchAllLabels() {
    const labels: TodoLabel[] = [];
    let cursor: string | undefined = undefined;
    while (true) {
      console.log("Fetching labels with cursor:", cursor);
      const labelsFetchResult = await this.api.getLabels({ cursor });
      for (const apiLabel of labelsFetchResult.results) {
        labels.push(new TodoLabel(apiLabel.name));
        this.labelIdMap.set(apiLabel.name, apiLabel.id); // マッピングを保存
      }
      if (labelsFetchResult.nextCursor == null) {
        break;
      }
      cursor = labelsFetchResult.nextCursor;
    }
    return labels;
  }

  createLabel(name: string): Effect.Effect<Option.Option<TodoLabel>, Error> {
    return Effect.gen(this, function* () {
      const existingLabels = yield* this.getLabels();
      const duplicate = existingLabels.find((l) => l.title === name);

      if (duplicate) {
        console.log(`Label "${name}" already exists, skipping creation`);
        return Option.none();
      }

      console.log(`Creating new label: ${name}`);
      // ここも Effect.tryPromise でラップ
      const newLabel = yield* Effect.tryPromise({
        try: async () => {
          const label = await this.api.addLabel({ name });
          this.labelIdMap.set(label.name, label.id); // マッピングを保存
          this.clearCache();
          return label;
        },
        catch: (error) => new Error(String(error)),
      });

      return Option.some(new TodoLabel(newLabel.name));
    });
  }

  deleteLabel(title: string): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      // タイトルからIDを検索
      let labelId = this.labelIdMap.get(title);

      // キャッシュになければ最新のラベル一覧を取得
      if (!labelId) {
        yield* this.getLabels(); // これでlabelIdMapが更新される
        labelId = this.labelIdMap.get(title);
      }

      if (!labelId) {
        return yield* Effect.fail(new Error(`Label "${title}" not found`));
      }

      yield* Effect.tryPromise({
        try: async () => {
          await this.api.deleteLabel(labelId!);
          this.labelIdMap.delete(title); // マッピングから削除
          this.clearCache();
        },
        catch: (error) => new Error(String(error)),
      });
    });
  }

  private clearCache(): void {
    console.log("Clearing cache");
    this.todoCache.clear();
    this.labelCache.clear();
    this.cacheExpiry.clear();
  }
}
