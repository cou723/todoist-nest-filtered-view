/**
 * デバッグ用の単発実行スクリプト
 * 依存関係ラベル管理システムのテスト実行用
 */

import { TodoistApi } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import { TodoService } from "./task-service.ts";
import { DependencyLabelAutomation } from "./dependency-label-automation.ts";

async function debugRun() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log("=== 依存関係ラベル管理システム デバッグ実行 ===");
    console.log(`[${new Date().toISOString()}] デバッグ実行開始`);

    const todoService = new TodoService(new TodoistApi(token));
    const dependencyLabelAutomation = new DependencyLabelAutomation(
      todoService,
    );

    // 依存関係ラベル管理のみを実行
    await dependencyLabelAutomation.manageDependencyLabels();

    console.log(`[${new Date().toISOString()}] デバッグ実行完了`);
    console.log("=== デバッグ実行終了 ===");
  } catch (error) {
    console.error("デバッグ実行中にエラーが発生:", error);
    Deno.exit(1);
  }
}

// メインモジュールとして実行された場合のみ実行
if (import.meta.main) {
  await debugRun();
}
