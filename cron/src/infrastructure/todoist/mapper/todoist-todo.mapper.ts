import { Task as TodoistTaskDTO } from "todoist";
import { Todo } from "../../../domain/model/todo/todo.ts";
import { TodoId } from "../../../domain/model/todo/todo-id.ts";
import { TodoLabel } from "../../../domain/model/todo/todo-label.ts";

export class TodoistTodoMapper {
  static toDomain(apiTask: TodoistTaskDTO): Todo {
    return new Todo(
      new TodoId(apiTask.id),
      apiTask.content,
      apiTask.labels.map((labelTitle) => new TodoLabel(labelTitle)),
      apiTask.parentId ? new TodoId(apiTask.parentId) : null,
      apiTask.completedAt !== null,
    );
  }

  // update時は部分的な更新オブジェクトを作るので、完全な逆変換は必ずしも必要ないが、
  // update用のオブジェクト生成ヘルパーとして定義しておくと便利
  static toUpdatePayload(todo: Todo): { labels: string[] } {
    return {
      labels: todo.labels.map((l) => l.title),
    };
  }
}