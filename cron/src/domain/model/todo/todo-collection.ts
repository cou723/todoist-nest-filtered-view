import { Either } from "effect";
import { Todo } from "./todo.ts";
import { TodoId } from "./todo-id.ts";

export class TodoCollection {
  private readonly todos: Todo[];
  private readonly todoMap: Map<string, Todo>;

  constructor(todos: Todo[]) {
    this.todos = todos;
    this.todoMap = new Map(todos.map((t) => [t.id.value, t]));
  }

  getAll(): Todo[] {
    return [...this.todos];
  }

  getById(id: TodoId): Todo | undefined {
    return this.todoMap.get(id.value);
  }

  filterByLabel(labelName: string): TodoCollection {
    return new TodoCollection(this.todos.filter((t) => t.hasLabel(labelName)));
  }

  /**
   * 子タスクを持たない @goal タスクを検索
   * 条件:
   * 1. @goal ラベルを持つ
   * 2. @non-milestone ラベルを持たない
   * 3. @task または @goal の子を持たない（マイルストーンTodoのみ持つ場合は含む）
   */
  findLeafGoalTodos(): Todo[] {
    const goalTodos = this.todos.filter((t) => t.isGoal() && !t.isNonMilestone());

    // 全タスクを対象に、親IDが一致するものを探す必要があるため、this.todos 全体を使う
    return goalTodos.filter((goalTodo) => {
      const hasTaskOrGoalChildren = this.todos.some((t) =>
        t.parentId?.equals(goalTodo.id) && (t.isWorkTodo() || t.isGoal())
      );
      return !hasTaskOrGoalChildren;
    });
  }

  /**
   * @task または @goal の子タスクを持つ @non-milestone タスクを検索
   */
  findNonMilestoneParentTodos(): Todo[] {
    const nonMilestoneTodos = this.todos.filter((t) => t.isNonMilestone());

    return nonMilestoneTodos.filter((parent) => {
      const hasTaskOrGoalChild = this.todos.some((child) =>
        child.parentId?.equals(parent.id) && (child.isWorkTodo() || child.isGoal())
      );
      return hasTaskOrGoalChild;
    });
  }

  /**
   * マイルストーン生成用のTodo（「～のマイルストーンを置く」）を持つかチェック
   */
  hasMilestoneTodoFor(parentId: TodoId): boolean {
    return this.todos.some((t) =>
      t.parentId?.equals(parentId) && t.isMilestoneTodo()
    );
  }

  /**
   * マイルストーンTodoを全て取得
   */
  findMilestoneTodos(): Todo[] {
    return this.todos.filter(t => t.isMilestoneTodo());
  }

  /**
   * 指定されたタスクに対してマイルストーンを作成可能か判定する
   * @returns Right(void): 作成可能, Left(string): スキップ理由
   */
  canMilestoneCreation(todo: Todo): Either.Either<void, string> {
    const hasTaskOrGoalChildren = this.todos.some((t) =>
      t.parentId?.equals(todo.id) && (t.isWorkTodo() || t.isGoal())
    );

    if (hasTaskOrGoalChildren) {
      return Either.left(`Skipping milestone creation for "${todo.content}" - has @task 
or @goal children`);
    }

    if (this.hasMilestoneTodoFor(todo.id)) {
      return Either.left(`Milestone todo already exists for "${todo.content}"`);
    }

    return Either.right(void 0);
  }
}