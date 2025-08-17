/**
 * Deno Script to Remove Milestone Todos
 * **のマイルストーンを書く系のTodoを削除するスクリプト
 */

import { TodoistApi } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import { TodoService } from "./task-service.ts";

/**
 * マイルストーンを書く系のTodoを削除する
 * @param todoService TaskService インスタンス
 */
async function removeMilestoneTodos(todoService: TodoService) {
  console.log("=== Removing Milestone Todos ===");

  // マイルストーンを書く系のTodoを特定
  const milestoneTodos = TodoService.findMilestoneTodos(
    await todoService.getAllTasks()
  );
  console.log(`Found ${milestoneTodos.length} milestone todos to remove`);

  // 削除対象のTodoを表示
  for (const todo of milestoneTodos) {
    console.log(`Found milestone todo: "${todo.content}" (ID: ${todo.id})`);
  }

  // 削除実行の確認
  if (milestoneTodos.length === 0) {
    console.log("No milestone todos found to remove");
    return;
  }

  console.log(`\n=== Removing ${milestoneTodos.length} milestone todos ===`);

  // 各Todoを削除
  for (const todo of milestoneTodos) {
    try {
      console.log(`Removing todo: "${todo.content}" (ID: ${todo.id})`);
      await todoService.deleteTask(todo.id);
      console.log(`✓ Successfully removed todo: "${todo.content}"`);
    } catch (error) {
      console.error(
        `✗ Failed to remove todo: "${todo.content}" (ID: ${todo.id})`,
        error
      );
    }
  }

  console.log(`\n=== Completed removal process ===`);
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log(
      `[${new Date().toISOString()}] Starting milestone task removal...`
    );

    const api = new TodoistApi(token);
    const todoService = new TodoService(api);
    await removeMilestoneTodos(todoService);

    console.log(
      `[${new Date().toISOString()}] Milestone todo removal completed successfully`
    );
  } catch (error) {
    console.error("Error in milestone todo removal:", error);
    Deno.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.main) {
  main();
}
