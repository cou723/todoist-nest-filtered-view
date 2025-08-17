/**
 * 依存関係ラベル自動化処理
 * goalTodoに基づくdep-ラベルの自動生成・削除を管理
 */

import { TodoService } from "./task-service.ts";
import { generateDepLabelName } from "./dependency-label-utils.ts";

/**
 * goalTodoとその親子関係の情報
 */
interface TodoWithHierarchy {
  id: string;
  content: string;
  parentId?: string | null;
  parent?: TodoWithHierarchy;
}

/**
 * 依存関係ラベル自動化管理クラス
 */
export class DependencyLabelAutomation {
  constructor(private todoService: TodoService) {}

  /**
   * goalTodo用のdep-ラベルを自動生成する
   */
  async generateDepLabelsForGoals(): Promise<void> {
    console.log("=== goalTodo用dep-ラベル自動生成開始 ===");

    // 全goalTodoを取得
    const goalTodos = await this.todoService.getTodosByLabel("goal");
    console.log(`Found ${goalTodos.length} goal todos`);

    if (goalTodos.length === 0) {
      console.log("No goal todos found, skipping label generation");
      return;
    }

    // 親子関係を構築
    const todoMap = new Map<string, TodoWithHierarchy>();
    const todosWithHierarchy: TodoWithHierarchy[] = goalTodos.map(todo => ({
      id: todo.id,
      content: todo.content,
      parentId: todo.parentId
    }));

    // マップに登録
    todosWithHierarchy.forEach(todo => {
      todoMap.set(todo.id, todo);
    });

    // 親子関係を解決
    todosWithHierarchy.forEach(todo => {
      if (todo.parentId) {
        todo.parent = todoMap.get(todo.parentId);
      }
    });

    // 各goalTodoに対してラベルを生成
    let createdCount = 0;
    for (const todo of todosWithHierarchy) {
      const labelName = generateDepLabelName(
        todo.content,
        todo.parent?.content
      );

      try {
        const label = await this.todoService.createLabel(labelName);
        if (label) {
          console.log(`Created label: ${labelName} for goal "${todo.content}"`);
          createdCount++;
        }
      } catch (error) {
        console.error(`Failed to create label ${labelName}:`, error);
      }
    }

    console.log(`✓ Created ${createdCount} new dependency labels`);
    console.log("=== goalTodo用dep-ラベル自動生成完了 ===");
  }

  /**
   * 完了済み・削除済みgoalTodoに対応するdep-ラベルを削除する
   */
  async cleanupCompletedGoalLabels(): Promise<void> {
    console.log("=== 不要dep-ラベル削除開始 ===");

    // 現在の全goalTodoを取得
    const currentGoalTodos = await this.todoService.getTodosByLabel("goal");
    console.log(`Found ${currentGoalTodos.length} current goal todos`);

    // 親子関係を構築（現在のgoalTodo用）
    const todoMap = new Map<string, TodoWithHierarchy>();
    const todosWithHierarchy: TodoWithHierarchy[] = currentGoalTodos.map(todo => ({
      id: todo.id,
      content: todo.content,
      parentId: todo.parentId
    }));

    todosWithHierarchy.forEach(todo => {
      todoMap.set(todo.id, todo);
    });

    todosWithHierarchy.forEach(todo => {
      if (todo.parentId) {
        todo.parent = todoMap.get(todo.parentId);
      }
    });

    // 現在必要なラベル名のセットを作成
    const requiredLabelNames = new Set<string>();
    todosWithHierarchy.forEach(todo => {
      const labelName = generateDepLabelName(
        todo.content,
        todo.parent?.content
      );
      requiredLabelNames.add(labelName);
    });

    console.log(`Required ${requiredLabelNames.size} dependency labels for current goals`);

    // 既存のdep-ラベルを取得
    const existingDepLabels = await this.todoService.getDepLabels();
    console.log(`Found ${existingDepLabels.length} existing dependency labels`);

    // 不要なラベルを特定して削除
    let deletedCount = 0;
    for (const label of existingDepLabels) {
      if (!requiredLabelNames.has(label.name)) {
        try {
          await this.todoService.deleteLabel(label.id);
          console.log(`Deleted unnecessary label: ${label.name}`);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete label ${label.name}:`, error);
        }
      }
    }

    console.log(`✓ Deleted ${deletedCount} unnecessary dependency labels`);
    console.log("=== 不要dep-ラベル削除完了 ===");
  }

  /**
   * 依存関係ラベル管理の統合処理
   * ラベル生成と不要ラベル削除を順次実行
   */
  async manageDependencyLabels(): Promise<void> {
    console.log("=== 依存関係ラベル管理開始 ===");

    try {
      // Step 1: 必要なラベルを生成
      await this.generateDepLabelsForGoals();

      // Step 2: 不要なラベルを削除
      await this.cleanupCompletedGoalLabels();

      console.log("✓ 依存関係ラベル管理完了");
    } catch (error) {
      console.error("依存関係ラベル管理中にエラーが発生:", error);
      throw error;
    }

    console.log("=== 依存関係ラベル管理終了 ===");
  }
}