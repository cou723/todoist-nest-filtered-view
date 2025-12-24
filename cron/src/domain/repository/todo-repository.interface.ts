import { Effect, Option } from "effect";
import { Todo } from "../model/todo/todo.ts";
import { TodoCollection } from "../model/todo/todo-collection.ts";
import { TodoId } from "../model/todo/todo-id.ts";
import { TodoLabel } from "../model/todo/todo-label.ts";

export interface ITodoRepository {
  getAll(): Effect.Effect<TodoCollection, Error>;

  /**
   * Todoの内容を更新する（ラベル変更など）
   */
  update(todo: Todo): Effect.Effect<void, Error>;

  /**
   * 新規Todoを作成する
   */
  create(content: string, parentId?: TodoId): Effect.Effect<Todo, Error>;

  /**
   * Todoを削除する
   */
  delete(id: TodoId): Effect.Effect<void, Error>;

  /**
   * 全ラベルを取得する
   */
  getLabels(): Effect.Effect<TodoLabel[], Error>;

  /**
   * ラベルを作成する
   * 既に存在する場合は Option.none() を返す（エラーではない）
   */
  createLabel(name: string): Effect.Effect<Option.Option<TodoLabel>, Error>;

  /**
   * ラベルを削除する（タイトルで指定）
   */
  deleteLabel(title: string): Effect.Effect<void, Error>;
}