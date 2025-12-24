import { TodoId } from "./todo-id.ts";
import { TodoLabel } from "./todo-label.ts";

export class Todo {
  constructor(
    public readonly id: TodoId,
    public content: string,
    public labels: TodoLabel[],
    public parentId: TodoId | null,
    public readonly isCompleted: boolean = false,
  ) {}

  hasLabel(labelName: string): boolean {
    return this.labels.some((l) => l.title === labelName);
  }

  isGoal(): boolean {
    return this.hasLabel("goal");
  }

  isWorkTodo(): boolean {
    return this.hasLabel("task");
  }

  isNonMilestone(): boolean {
    return this.hasLabel("non-milestone");
  }

  isMilestoneTodo(): boolean {
    return (
      this.content.includes("のマイルストーンを") ||
      this.content.includes("マイルストーンを置く") ||
      this.content.includes("マイルストーンを書く")
    );
  }

  addLabel(label: TodoLabel): void {
    if (!this.hasLabel(label.title)) {
      this.labels = [...this.labels, label];
    }
  }

  removeLabel(labelName: string): void {
    this.labels = this.labels.filter((l) => l.title !== labelName);
  }
}