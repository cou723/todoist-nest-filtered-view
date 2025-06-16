/**
 * Test for findGoalTasksWithoutSubtasks function using Deno.test
 */

import { Task } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// テスト対象の関数をコピー
function hasLabel(task: Task, labelName: string): boolean {
  return task.labels.includes(labelName);
}

function findGoalTasksWithoutSubtasks(tasks: Task[]): Task[] {
  const goalTasks = tasks.filter(task => 
    hasLabel(task, "goal") && !hasLabel(task, "non-milestone")
  );

  const taskLabelTasks = tasks.filter(task => hasLabel(task, "task"));

  return goalTasks.filter(goalTask => {
    const hasTaskLabeledSubtasks = taskLabelTasks.some(taskTask => 
      taskTask.parentId === goalTask.id
    );
    return !hasTaskLabeledSubtasks;
  });
}

// テストデータを作成
function createTestTasks(): Task[] {
  const tasks: Task[] = [
    // Goal task without @task children (should be included)
    {
      id: "goal1",
      content: "Goal without task children",
      labels: ["goal"],
      parentId: null,
    } as Task,
    
    // Goal task with @task children (should be excluded)
    {
      id: "goal2", 
      content: "Goal with task children",
      labels: ["goal"],
      parentId: null,
    } as Task,
    
    // Task child of goal2
    {
      id: "task1",
      content: "Task child of goal2",
      labels: ["task"],
      parentId: "goal2",
    } as Task,
    
    // Goal task with @non-milestone (should be excluded)
    {
      id: "goal3",
      content: "Goal with non-milestone",
      labels: ["goal", "non-milestone"],
      parentId: null,
    } as Task,
    
    // Goal task with non-@task children (should be included)
    {
      id: "goal4",
      content: "Goal with non-task children", 
      labels: ["goal"],
      parentId: null,
    } as Task,
    
    // Non-task child of goal4
    {
      id: "child1",
      content: "Non-task child of goal4",
      labels: ["other"],
      parentId: "goal4",
    } as Task,
    
    // Task with no parent
    {
      id: "task2",
      content: "Standalone task",
      labels: ["task"],
      parentId: null,
    } as Task,
  ];
  
  return tasks;
}

Deno.test("findGoalTasksWithoutSubtasks should return correct tasks", () => {
  const testTasks = createTestTasks();
  const result = findGoalTasksWithoutSubtasks(testTasks);
  
  // 期待値: goal1 (子なし) と goal4 (@taskでない子あり)
  const expectedIds = ["goal1", "goal4"];
  const actualIds = result.map(t => t.id).sort();
  
  assertEquals(actualIds.sort(), expectedIds.sort(), "Should return goal1 and goal4");
  assertEquals(result.length, 2, "Should return exactly 2 tasks");
});

Deno.test("findGoalTasksWithoutSubtasks should exclude goals with @task children", () => {
  const testTasks = createTestTasks();
  const result = findGoalTasksWithoutSubtasks(testTasks);
  
  // goal2は@taskの子を持つので除外されるべき
  const goal2Included = result.some(t => t.id === "goal2");
  assert(!goal2Included, "Should exclude goal2 which has @task children");
});

Deno.test("findGoalTasksWithoutSubtasks should exclude goals with @non-milestone", () => {
  const testTasks = createTestTasks();
  const result = findGoalTasksWithoutSubtasks(testTasks);
  
  // goal3は@non-milestoneラベルを持つので除外されるべき
  const goal3Included = result.some(t => t.id === "goal3");
  assert(!goal3Included, "Should exclude goal3 which has @non-milestone label");
});

Deno.test("findGoalTasksWithoutSubtasks should include goals with non-@task children", () => {
  const testTasks = createTestTasks();
  const result = findGoalTasksWithoutSubtasks(testTasks);
  
  // goal4は@taskでない子を持つので含まれるべき
  const goal4Included = result.some(t => t.id === "goal4");
  assert(goal4Included, "Should include goal4 which has non-@task children");
});