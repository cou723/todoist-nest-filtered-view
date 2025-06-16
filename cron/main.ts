/**
 * Deno Cron Service
 * Todoistタスクの自動タグ管理サービス
 */

import { TodoistApi } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";
import type {
  Label,
  Task,
} from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";

function hasLabel(task: Task, labelName: string): boolean {
  return task.labels.includes(labelName);
}


function findGoalTasksWithoutTaskSubtasks(
  goalTasks: Task[],
  allTasks: Task[],
): Task[] {
  const goalTasksWithoutNonMilestone = goalTasks.filter((task) =>
    !hasLabel(task, "non-milestone")
  );

  const taskLabelTasks = allTasks.filter((task) => hasLabel(task, "task"));

  console.log(
    `Found ${goalTasksWithoutNonMilestone.length} goal tasks without non-milestone label`,
  );
  console.log(`Found ${taskLabelTasks.length} tasks with @task label`);

  return goalTasksWithoutNonMilestone.filter((goalTask) => {
    const hasTaskLabeledSubtasks = taskLabelTasks.some((taskTask) =>
      taskTask.parentId === goalTask.id
    );
    
    const hasGoalLabeledSubtasks = goalTasks.some((goalSubtask) =>
      goalSubtask.parentId === goalTask.id
    );
    
    console.log(
      `Goal task "${goalTask.content}" (ID: ${goalTask.id}) has @task children: ${hasTaskLabeledSubtasks}, has @goal children: ${hasGoalLabeledSubtasks}`,
    );
    
    // @taskまたは@goalの子タスクがある場合は除外
    return !hasTaskLabeledSubtasks && !hasGoalLabeledSubtasks;
  });
}

function findNonMilestoneTasksWithTaskChildren(tasks: Task[]): Task[] {
  const nonMilestoneTasks = tasks.filter((task) =>
    hasLabel(task, "non-milestone")
  );
  const taskLabelTasks = tasks.filter((task) => hasLabel(task, "task"));

  console.log(`Found ${nonMilestoneTasks.length} non-milestone tasks`);

  return nonMilestoneTasks.filter((nonMilestoneTask) => {
    const hasTaskChildren = taskLabelTasks.some((taskTask) =>
      taskTask.parentId === nonMilestoneTask.id
    );
    console.log(
      `Non-milestone task "${nonMilestoneTask.content}" (ID: ${nonMilestoneTask.id}) has @task children: ${hasTaskChildren}`,
    );
    return hasTaskChildren;
  });
}

function generateBlockedByLabelsFromGoalNames(tasks: Task[]): string[] {
  const goalTasks = tasks.filter(task => hasLabel(task, "goal"));
  
  return Array.from(
    new Set(
      goalTasks.map(task => {
        if (task.parentId) {
          // 親タスクを探す
          const parentTask = tasks.find(t => t.id === task.parentId);
          const parentName = parentTask ? parentTask.content : "unknown";
          return `blocked-by-${parentName}-${task.content}`;
        } else {
          // 親タスクがない場合はタスク名のみ
          return `blocked-by-${task.content}`;
        }
      })
    )
  );
}


function getTaskInfoFromBlockedLabel(label: string): { parentName?: string; taskName: string } {
  const nameWithoutPrefix = label.replace("blocked-by-", "");
  const parts = nameWithoutPrefix.split("-");
  
  if (parts.length >= 2) {
    // 親タスク名-タスク名の形式
    const parentName = parts[0];
    const taskName = parts.slice(1).join("-"); // 複数のハイフンがある場合に対応
    return { parentName, taskName };
  } else {
    // タスク名のみの形式
    return { taskName: nameWithoutPrefix };
  }
}

async function processGoalTasks(api: TodoistApi) {
  console.log("=== Processing Goal Tasks ===");

  // @goalタスクのみを効率的に取得
  const goalTasks = await api.getTasks({ filter: "@goal" });
  console.log(`Retrieved ${goalTasks.length} @goal tasks from API`);

  // @taskタスクも取得（子タスクチェック用）
  const taskTasks = await api.getTasks({ filter: "@task" });
  console.log(`Retrieved ${taskTasks.length} @task tasks from API`);

  // 全てのタスクを結合（子タスクチェックのため）
  const allTasks = [...goalTasks, ...taskTasks];

  const goalTasksWithoutSubtasks = findGoalTasksWithoutTaskSubtasks(
    goalTasks,
    allTasks,
  );

  console.log(
    `Found ${goalTasksWithoutSubtasks.length} goal tasks to add @non-milestone tag`,
  );

  for (const goalTask of goalTasksWithoutSubtasks) {
    console.log(
      `Processing goal task: ${goalTask.content} (current labels: ${
        goalTask.labels.join(", ")
      })`,
    );

    // @non-milestoneタグを追加
    const updatedLabels = [...goalTask.labels, "non-milestone"];
    await api.updateTask(goalTask.id, { labels: updatedLabels });
    console.log(
      `Updated task ${goalTask.id} with labels: ${updatedLabels.join(", ")}`,
    );

    // マイルストーンタスクを子として作成
    const milestoneContent = `${goalTask.content}のマイルストーンを置く`;
    await api.addTask({
      content: milestoneContent,
      parentId: goalTask.id
    });
    console.log(
      `Created milestone task: "${milestoneContent}" as child of ${goalTask.id}`,
    );

    console.log(
      `Added @non-milestone tag and created milestone task for: ${goalTask.content}`,
    );
  }
}

async function processNonMilestoneTasks(api: TodoistApi) {
  console.log("=== Processing Non-Milestone Tasks ===");

  // @non-milestoneタスクのみを効率的に取得
  const nonMilestoneTasks = await api.getTasks({ filter: "@non-milestone" });
  console.log(
    `Retrieved ${nonMilestoneTasks.length} @non-milestone tasks from API`,
  );

  // @taskタスクも取得（子タスクチェック用）
  const taskTasks = await api.getTasks({ filter: "@task" });
  console.log(`Retrieved ${taskTasks.length} @task tasks from API`);

  const nonMilestoneTasksWithTaskChildren =
    findNonMilestoneTasksWithTaskChildren([...nonMilestoneTasks, ...taskTasks]);

  console.log(
    `Found ${nonMilestoneTasksWithTaskChildren.length} non-milestone tasks to remove @non-milestone tag`,
  );

  for (const task of nonMilestoneTasksWithTaskChildren) {
    console.log(
      `Removing @non-milestone from task: ${task.content} (current labels: ${
        task.labels.join(", ")
      })`,
    );

    // @non-milestoneタグを削除
    const updatedLabels = task.labels.filter((label) =>
      label !== "non-milestone"
    );
    await api.updateTask(task.id, { labels: updatedLabels });
    console.log(
      `Updated task ${task.id} with labels: ${updatedLabels.join(", ")}`,
    );

    console.log(
      `Removed @non-milestone tag from: ${task.content}`,
    );
  }
}

async function processBlockedByLabels(api: TodoistApi) {
  console.log("=== Processing Blocked By Labels ===");
  
  // gcプロジェクトの@goalタスクのみを取得
  const gcGoalTasks = await api.getTasks({ filter: "#gc & @goal" });
  console.log(`Retrieved ${gcGoalTasks.length} @goal tasks from gc project`);
  
  // 親タスク情報が必要な場合はgcプロジェクトの全タスクを取得
  const allGcTasks = await api.getTasks({ filter: "#gc" });
  console.log(`Retrieved ${allGcTasks.length} total tasks from gc project`);
  
  const existingLabels = await api.getLabels();
  const requiredBlockedByLabels = generateBlockedByLabelsFromGoalNames(allGcTasks);
  
  // @goalタスクのみを抽出（削除チェック用）
  const goalTasks = allGcTasks.filter(task => hasLabel(task, "goal"));

  console.log(`Found ${requiredBlockedByLabels.length} blocked-by labels to create`);

  // 新しい@blocked-by-ラベルをアカウントに追加
  for (const labelName of requiredBlockedByLabels) {
    const existingLabel = existingLabels.find((label) =>
      label.name === labelName
    );
    if (!existingLabel) {
      await api.addLabel({ name: labelName, color: "red" });
      console.log(`Created label: ${labelName} with color red`);
    }
  }

  // 存在しないタスクの@blocked-by-ラベルを削除
  const existingBlockedLabels = existingLabels.filter((label) =>
    label.name.startsWith("blocked-by-")
  );

  console.log(
    `Found ${existingBlockedLabels.length} existing blocked-by labels to check`,
  );

  for (const label of existingBlockedLabels) {
    const taskInfo = getTaskInfoFromBlockedLabel(label.name);
    const taskExists = goalTasks.some((task) => task.content === taskInfo.taskName);

    if (!taskExists) {
      await api.deleteLabel(label.id);
      console.log(`Deleted orphaned label: ${label.name}`);
    }
  }
}

async function runAutomation() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }

    console.log(`[${new Date().toISOString()}] Starting automation...`);

    const api = new TodoistApi(token);

    await processGoalTasks(api);
    await processNonMilestoneTasks(api);
    await processBlockedByLabels(api);

    console.log(
      `[${new Date().toISOString()}] Automation completed successfully`,
    );
  } catch (error) {
    console.error("Error in automation:", error);
  }
}

// 初回実行
runAutomation();

// 1時間おきに実行
setInterval(runAutomation, 60 * 60 * 1000);

console.log("Todoist automation service started - running every hour");
