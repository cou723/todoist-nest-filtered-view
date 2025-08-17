/*
@non-milestoneの自動付与、剥奪を自動化するスクリプト
deno deployでデプロイすることを想定している

Todoには@goalもしくは@taskが付与されていることを前提としていて、@taskが付与されたサブTodoを持たない@goalは@non-milestoneが付与される
@goalにサブTodoがある場合は@non-milestoneが剥奪される

@non-milestoneにはサブTodoとして「${Todo名}のマイルストーンを置く」というTodoを追加する。このTodoはラベルを持たない
*/

import { TodoistApi } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import { TodoService } from "./task-service.ts";

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

async function generateDependencyLabels(
  todoService: TodoService,
): Promise<void> {
  console.log("=== Generating Dependency Labels ===");

  // @goalラベルが付いているTodoを取得
  const goalTodos = await todoService.getTodosByLabel("goal");
  const allTodos = await todoService.getAllTasks();
  const existingLabels = await todoService.getLabels();
  const existingLabelNames = new Set(existingLabels.map((label) => label.name));

  console.log(
    `Found ${goalTodos.length} goal todos for dependency label generation`,
  );

  let createdCount = 0;
  for (const goalTodo of goalTodos) {
    // 親Todoを探す
    const parentTodo = goalTodo.parentId
      ? allTodos.find((t) => t.id === goalTodo.parentId)
      : undefined;

    // dep系ラベル名を生成
    const labelName = TodoService.generateDependencyLabelName(
      goalTodo.content,
      parentTodo?.content,
    );

    // ラベルが既に存在するかチェック
    if (!existingLabelNames.has(labelName)) {
      console.log(`Creating dependency label: ${labelName}`);
      await todoService.createLabel(labelName);
      existingLabelNames.add(labelName);
      createdCount++;
    }
  }

  if (createdCount > 0) {
    console.log(`✓ Created ${createdCount} dependency labels`);
  } else {
    console.log("No new dependency labels needed");
  }
}

async function cleanupDependencyLabels(
  todoService: TodoService,
): Promise<void> {
  console.log("=== Cleaning up Dependency Labels ===");

  // 既存のdep系ラベルを取得
  const allLabels = await todoService.getLabels();
  const dependencyLabels = allLabels.filter((label) =>
    label.name.startsWith("dep-")
  );

  console.log(`Found ${dependencyLabels.length} dependency labels to check`);

  // 完了済みタスクを取得
  const completedTasks = await todoService.getCompletedTasks();
  const allTodos = await todoService.getAllTasks();

  // 完了済みの@goalTodoの内容を取得
  const completedGoalContents = new Set(
    completedTasks
      .filter((task) => task.labels.includes("goal"))
      .map((task) => task.content),
  );

  let deletedCount = 0;
  for (const label of dependencyLabels) {
    // ラベル名からTodo名を抽出
    const labelName = label.name;
    const match = labelName.match(/^dep-(?:(.+)_)?(.+)$/);

    if (!match) {
      console.log(`Invalid dependency label format: ${labelName}`);
      continue;
    }

    const [, parentName, todoName] = match;

    // 依存元Todo（@goalTodo）が完了済みかチェック
    const isDependencyCompleted = completedGoalContents.has(todoName) ||
      (parentName && completedGoalContents.has(parentName));

    if (isDependencyCompleted) {
      console.log(
        `Deleting dependency label: ${labelName} (dependency completed)`,
      );
      await todoService.deleteLabel(label.id);
      deletedCount++;
    } else {
      // 該当する@goalTodoが存在するかチェック
      const correspondingGoalExists = allTodos.some((todo) =>
        todo.labels.includes("goal") && (
          todo.content === todoName ||
          (parentName && todo.content === todoName &&
            allTodos.some((parent) =>
              parent.id === todo.parentId && parent.content === parentName
            ))
        )
      );

      if (!correspondingGoalExists) {
        console.log(
          `Deleting dependency label: ${labelName} (corresponding goal not found)`,
        );
        await todoService.deleteLabel(label.id);
        deletedCount++;
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`✓ Deleted ${deletedCount} dependency labels`);
  } else {
    console.log("No dependency labels needed cleanup");
  }
}

export async function runAutomation() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log(`[${new Date().toISOString()}] Starting automation...`);

    const todoService = new TodoService(new TodoistApi(token));

    await assignNonMilestoneToGoals(todoService);
    await createMilestoneTodosForGoals(todoService);
    await cleanupNonMilestoneTodos(todoService);
    await generateDependencyLabels(todoService);
    await cleanupDependencyLabels(todoService);

    console.log(
      `[${new Date().toISOString()}] Automation completed successfully`,
    );
  } catch (error) {
    console.error("Error in automation:", error);
  }
}

// メインモジュールとして実行された場合のみCronを設定
if (import.meta.main) {
  // Deno.cronを使って1時間おきに実行
  Deno.cron("todoist-automation", "0 * * * *", runAutomation);

  console.log(
    "Todoist automation service started - running every hour with Deno.cron",
  );
}
