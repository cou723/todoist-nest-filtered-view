/**
 * Test for automation functions: assignNonMilestoneToGoals, createMilestoneTodosForGoals, cleanupNonMilestoneTodos
 */

import { Task, TodoistApi } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TodoService } from "./task-service.ts";

// モック用のTodoistApi
class MockTodoistApi {
  private tasks: Task[] = [];
  private nextId = 1;

  getTasks(options?: { filter?: string }): Promise<Task[]> {
    if (options?.filter) {
      const labelMatch = options.filter.match(/@(\w+)/);
      if (labelMatch) {
        const label = labelMatch[1];
        return Promise.resolve(this.tasks.filter(task => task.labels.includes(label)));
      }
    }
    return Promise.resolve(this.tasks);
  }

  updateTask(taskId: string, updates: { labels?: string[] }): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && updates.labels) {
      task.labels = updates.labels;
    }
    return Promise.resolve();
  }

  addTask(task: { content: string; parentId?: string; labels?: string[] }): Promise<void> {
    const newTask: Task = {
      id: this.nextId.toString(),
      content: task.content,
      labels: task.labels || [],
      parentId: task.parentId || null,
      isCompleted: false,
      projectId: "1",
      sectionId: null,
      createdAt: new Date().toISOString(),
      creatorId: "1",
      url: "",
      commentCount: 0,
      assigneeId: null,
      assignerId: null,
      order: 1,
      priority: 1,
      due: null,
      description: "",
      duration: null,
    };
    this.tasks.push(newTask);
    this.nextId++;
    return Promise.resolve();
  }

  deleteTask(taskId: string): Promise<void> {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    return Promise.resolve();
  }

  // テスト用のヘルパーメソッド
  setTasks(tasks: Task[]): void {
    this.tasks = tasks;
  }

  getTasks_mock(): Task[] {
    return this.tasks;
  }
}

// テスト用のタスクデータ作成関数
function createTestTodo(id: string, content: string, labels: string[], parentId: string | null = null): Task {
  return {
    id,
    content,
    labels,
    parentId,
    isCompleted: false,
    projectId: "1",
    sectionId: null,
    createdAt: new Date().toISOString(),
    creatorId: "1",
    url: "",
    commentCount: 0,
    assigneeId: null,
    assignerId: null,
    order: 1,
    priority: 1,
    due: null,
    description: "",
    duration: null,
  };
}

// テスト対象の関数をインポート
async function assignNonMilestoneToGoals(todoService: TodoService): Promise<void> {
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

async function createMilestoneTodosForGoals(todoService: TodoService): Promise<void> {
  console.log("=== Creating Milestone Todos for Goals ===");

  const allTodos = await todoService.getAllTasks();
  const nonMilestoneGoalTodos = allTodos.filter((todo) =>
    todo.labels.includes("goal") &&
    todo.labels.includes("non-milestone")
  );

  console.log(`Found ${nonMilestoneGoalTodos.length} non-milestone goal todos`);

  let createdCount = 0;
  for (const goalTodo of nonMilestoneGoalTodos) {
    const hasTaskOrGoalChildren = allTodos.some((todo) =>
      todo.parentId === goalTodo.id &&
      (todo.labels.includes("task") || todo.labels.includes("goal"))
    );

    if (hasTaskOrGoalChildren) {
      console.log(
        `Skipping milestone creation for "${goalTodo.content}" - has @task or @goal children`,
      );
      continue;
    }

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

async function cleanupNonMilestoneTodos(todoService: TodoService): Promise<void> {
  console.log("=== Processing Non-Milestone Todos ===");

  const analysis = await TodoService.analyzeTasksForAutomation(
    todoService.getDataProvider(),
  );

  console.log(
    `Found ${analysis.nonMilestoneParentTodos.length} non-milestone todos to clean up`,
  );

  for (const todo of analysis.nonMilestoneParentTodos) {
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

// テスト開始
Deno.test("assignNonMilestoneToGoals: 子タスクを持たないゴールタスクに@non-milestoneラベルを付与する", async () => {
  const mockApi = new MockTodoistApi();
  const todoService = new TodoService(mockApi as unknown as TodoistApi);

  // テストデータをセット
  const testTasks = [
    createTestTodo("1", "Goal without children", ["goal"]),
    createTestTodo("2", "Goal with task child", ["goal"]),
    createTestTodo("3", "Task child", ["task"], "2"),
    createTestTodo("4", "Goal with non-milestone", ["goal", "non-milestone"]),
  ];
  mockApi.setTasks(testTasks);

  // 関数実行
  await assignNonMilestoneToGoals(todoService);

  // 結果確認
  const updatedTasks = mockApi.getTasks_mock();
  const goalWithoutChildren = updatedTasks.find(t => t.id === "1");
  const goalWithChildren = updatedTasks.find(t => t.id === "2");
  const alreadyNonMilestone = updatedTasks.find(t => t.id === "4");

  assertEquals(goalWithoutChildren?.labels, ["goal", "non-milestone"]);
  assertEquals(goalWithChildren?.labels, ["goal"]);
  assertEquals(alreadyNonMilestone?.labels, ["goal", "non-milestone"]);
});

Deno.test("createMilestoneTodosForGoals: @non-milestoneな@goalタスクのマイルストーンTodoを作成する", async () => {
  const mockApi = new MockTodoistApi();
  const todoService = new TodoService(mockApi as unknown as TodoistApi);

  // テストデータをセット
  const testTasks = [
    createTestTodo("1", "Goal with non-milestone", ["goal", "non-milestone"]),
    createTestTodo("2", "Goal with task child", ["goal", "non-milestone"]),
    createTestTodo("3", "Task child", ["task"], "2"),
  ];
  mockApi.setTasks(testTasks);

  // 関数実行
  await createMilestoneTodosForGoals(todoService);

  // 結果確認
  const updatedTasks = mockApi.getTasks_mock();
  const milestoneTodos = updatedTasks.filter(t => t.content.includes("のマイルストーンを置く"));
  
  assertEquals(milestoneTodos.length, 1);
  assertEquals(milestoneTodos[0].parentId, "1");
  assertEquals(milestoneTodos[0].content, "Goal with non-milestoneのマイルストーンを置く");
});

Deno.test("createMilestoneTodosForGoals: @taskまたは@goalの子タスクを持つゴールはスキップする", async () => {
  const mockApi = new MockTodoistApi();
  const todoService = new TodoService(mockApi as unknown as TodoistApi);

  // テストデータをセット
  const testTasks = [
    createTestTodo("1", "Goal with task child", ["goal", "non-milestone"]),
    createTestTodo("2", "Task child", ["task"], "1"),
    createTestTodo("3", "Goal with goal child", ["goal", "non-milestone"]),
    createTestTodo("4", "Goal child", ["goal"], "3"),
  ];
  mockApi.setTasks(testTasks);

  // 関数実行
  await createMilestoneTodosForGoals(todoService);

  // 結果確認
  const updatedTasks = mockApi.getTasks_mock();
  const milestoneTodos = updatedTasks.filter(t => t.content.includes("のマイルストーンを置く"));
  
  assertEquals(milestoneTodos.length, 0);
});

Deno.test("createMilestoneTodosForGoals: 既存のマイルストーンTodoがある場合は重複作成しない", async () => {
  const mockApi = new MockTodoistApi();
  const todoService = new TodoService(mockApi as unknown as TodoistApi);

  // テストデータをセット
  const testTasks = [
    createTestTodo("1", "Goal with milestone", ["goal", "non-milestone"]),
    createTestTodo("2", "Goal with milestoneのマイルストーンを置く", [], "1"),
  ];
  mockApi.setTasks(testTasks);

  // 関数実行
  await createMilestoneTodosForGoals(todoService);

  // 結果確認
  const updatedTasks = mockApi.getTasks_mock();
  const milestoneTodos = updatedTasks.filter(t => t.content.includes("のマイルストーンを置く"));
  
  assertEquals(milestoneTodos.length, 1);
});

Deno.test("cleanupNonMilestoneTodos: @taskまたは@goalの子タスクを持つ@non-milestoneタスクからラベルを削除する", async () => {
  const mockApi = new MockTodoistApi();
  const todoService = new TodoService(mockApi as unknown as TodoistApi);

  // テストデータをセット
  const testTasks = [
    createTestTodo("1", "Non-milestone with task child", ["goal", "non-milestone"]),
    createTestTodo("2", "Task child", ["task"], "1"),
    createTestTodo("3", "Non-milestone with goal child", ["goal", "non-milestone"]),
    createTestTodo("4", "Goal child", ["goal"], "3"),
    createTestTodo("5", "Non-milestone without children", ["goal", "non-milestone"]),
  ];
  mockApi.setTasks(testTasks);

  // 関数実行
  await cleanupNonMilestoneTodos(todoService);

  // 結果確認
  const updatedTasks = mockApi.getTasks_mock();
  const nonMilestoneWithTaskChild = updatedTasks.find(t => t.id === "1");
  const nonMilestoneWithGoalChild = updatedTasks.find(t => t.id === "3");
  const nonMilestoneWithoutChildren = updatedTasks.find(t => t.id === "5");

  assertEquals(nonMilestoneWithTaskChild?.labels, ["goal"]);
  assertEquals(nonMilestoneWithGoalChild?.labels, ["goal"]);
  assertEquals(nonMilestoneWithoutChildren?.labels, ["goal", "non-milestone"]);
});

Deno.test("cleanupNonMilestoneTodos: @non-milestoneラベルを持たないタスクには影響しない", async () => {
  const mockApi = new MockTodoistApi();
  const todoService = new TodoService(mockApi as unknown as TodoistApi);

  // テストデータをセット
  const testTasks = [
    createTestTodo("1", "Goal without non-milestone", ["goal"]),
    createTestTodo("2", "Task child", ["task"], "1"),
  ];
  mockApi.setTasks(testTasks);

  // 関数実行
  await cleanupNonMilestoneTodos(todoService);

  // 結果確認
  const updatedTasks = mockApi.getTasks_mock();
  const goal = updatedTasks.find(t => t.id === "1");

  assertEquals(goal?.labels, ["goal"]);
});