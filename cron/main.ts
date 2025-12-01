/*
@non-milestoneの自動付与、剥奪を自動化するスクリプト
deno deployでデプロイすることを想定している

Todoには@goalもしくは@taskが付与されていることを前提としていて、@taskが付与されたサブTodoを持たない@goalは@non-milestoneが付与される
@goalにサブTodoがある場合は@non-milestoneが剥奪される

@non-milestoneにはサブTodoとして「${Todo名}のマイルストーンを置く」というTodoを追加する。このTodoはラベルを持たない
*/

import { TodoistApi } from "todoist";
import { TodoService } from "./task-service.ts";
import { DependencyLabelAutomation } from "./dependency-label-automation.ts";

async function assignNonMilestoneToGoals(
  todoService: TodoService,
): Promise<void> {
  console.log("=== Assigning Non-Milestone to Goals ===");

  const analysis = await TodoService.analyzeTasksForAutomation(
    todoService.getDataProvider(),
  );

  console.log(
    `Found ${analysis.leafGoalTodos.length} goal todos to assign non-milestone`,
  );

  for (const goalTodo of analysis.leafGoalTodos) {
    await todoService.updateTask(goalTodo.id, {
      labels: [...goalTodo.labels, "non-milestone"],
    });
  }

  if (analysis.leafGoalTodos.length > 0) {
    console.log(
      `✓ Assigned non-milestone to ${analysis.leafGoalTodos.length} goal todos`,
    );
  }
}

async function createMilestoneTodosForGoals(
  todoService: TodoService,
): Promise<void> {
  console.log("=== Creating Milestone Todos for Goals ===");

  // @goalかつ@non-milestoneのTodoを取得
  const allTodos = await todoService.getAllTasks();
  const nonMilestoneGoalTodos = allTodos.filter((todo) =>
    todo.labels.includes("goal") &&
    todo.labels.includes("non-milestone")
  );

  console.log(`Found ${nonMilestoneGoalTodos.length} non-milestone goal todos`);

  let createdCount = 0;
  for (const goalTodo of nonMilestoneGoalTodos) {
    // この@goalが@non-milestone削除条件に合致するかチェック
    const hasTaskOrGoalChildren = allTodos.some((todo) =>
      todo.parentId === goalTodo.id &&
      (todo.labels.includes("task") || todo.labels.includes("goal"))
    );

    // @non-milestone削除条件に合致する場合はマイルストーンTodo作成をスキップ
    if (hasTaskOrGoalChildren) {
      console.log(
        `Skipping milestone creation for "${goalTodo.content}" - has @task or @goal children`,
      );
      continue;
    }

    // 既存のマイルストーンTodoがあるかチェック
    const existingMilestone = allTodos.find((todo) =>
      todo.parentId === goalTodo.id &&
      TodoService.findMilestoneTodos([todo]).length > 0
    );

    if (existingMilestone) {
      console.log(
        `Milestone todo already exists for "${goalTodo.content}"`,
      );
      continue;
    }

    // マイルストーンTodoを作成
    await todoService.addTodo({
      content: `${goalTodo.content}のマイルストーンを置く`,
      parentId: goalTodo.id,
    });
    createdCount++;
  }

  if (createdCount > 0) {
    console.log(`✓ Created ${createdCount} milestone todos`);
  }
}

async function cleanupNonMilestoneTodos(todoService: TodoService) {
  console.log("=== Processing Non-Milestone Todos ===");

  const analysis = await TodoService.analyzeTasksForAutomation(
    todoService.getDataProvider(),
  );

  console.log(
    `Found ${analysis.nonMilestoneParentTodos.length} non-milestone todos to clean up`,
  );

  for (const todo of analysis.nonMilestoneParentTodos) {
    // @non-milestoneタグを削除
    const updatedLabels = todo.labels.filter((label) =>
      label !== "non-milestone"
    );
    await todoService.updateTask(todo.id, { labels: updatedLabels });
  }

  if (analysis.nonMilestoneParentTodos.length > 0) {
    console.log(
      `✓ Processed ${analysis.nonMilestoneParentTodos.length} non-milestone todos`,
    );
  }
}

async function runAutomation() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      console.log("TODOIST_TOKEN not set; skipping automation run");
      return;
    }

    console.log(`[${new Date().toISOString()}] Starting automation...`);

    const todoService = new TodoService(new TodoistApi(token));
    const dependencyLabelAutomation = new DependencyLabelAutomation(todoService);

    // 既存の処理
    await assignNonMilestoneToGoals(todoService);
    await createMilestoneTodosForGoals(todoService);
    await cleanupNonMilestoneTodos(todoService);

    // 依存関係ラベル管理（新規追加）
    await dependencyLabelAutomation.manageDependencyLabels();

    console.log(
      `[${new Date().toISOString()}] Automation completed successfully`,
    );
  } catch (error) {
    console.error("Error in automation:", error);
  }
}

// Deno.cronを使って1時間おきに実行
Deno.cron("todoist-automation", "0 * * * *", runAutomation);

console.log("Todoist automation service started - running every hour with Deno.cron");
