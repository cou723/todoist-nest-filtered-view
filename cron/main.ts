/**
 * Deno Cron Service
 * Todoistタスクの自動タグ管理サービス
 */

import { Task, Label } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";

interface TodoistApi {
  token: string;
}

class TodoistApiClient implements TodoistApi {
  constructor(public token: string) {}

  private async apiCall(method: string, endpoint: string, body?: any): Promise<any> {
    const response = await fetch(`https://api.todoist.com/rest/v2${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Todoist API error: ${response.status} ${response.statusText}`);
    }

    return response.status === 204 ? null : await response.json();
  }

  async getTasks(): Promise<Task[]> {
    return await this.apiCall("GET", "/tasks");
  }

  async getLabels(): Promise<Label[]> {
    return await this.apiCall("GET", "/labels");
  }

  async createLabel(name: string, color: string = "blue"): Promise<Label> {
    return await this.apiCall("POST", "/labels", { name, color });
  }

  async deleteLabel(id: string): Promise<void> {
    await this.apiCall("DELETE", `/labels/${id}`);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return await this.apiCall("POST", `/tasks/${id}`, updates);
  }

  async createTask(content: string, options: any = {}): Promise<Task> {
    return await this.apiCall("POST", "/tasks", { content, ...options });
  }
}

function hasLabel(task: Task, labelName: string): boolean {
  return task.labels.includes(labelName);
}

function findGoalTasksWithoutSubtasks(tasks: Task[]): Task[] {
  const goalTasks = tasks.filter(task => 
    hasLabel(task, "goal") && !hasLabel(task, "non-milestone")
  );

  const taskLabelTasks = tasks.filter(task => hasLabel(task, "task"));

  return goalTasks.filter(goalTask => {
    const hasSubtasks = taskLabelTasks.some(taskTask => 
      taskTask.parentId === goalTask.id
    );
    return !hasSubtasks;
  });
}

function findNonMilestoneTasksWithTaskChildren(tasks: Task[]): Task[] {
  const nonMilestoneTasks = tasks.filter(task => hasLabel(task, "non-milestone"));
  const taskLabelTasks = tasks.filter(task => hasLabel(task, "task"));

  return nonMilestoneTasks.filter(nonMilestoneTask => {
    return taskLabelTasks.some(taskTask => 
      taskTask.parentId === nonMilestoneTask.id
    );
  });
}

function extractBlockedByLabels(tasks: Task[]): string[] {
  const blockedByLabels = new Set<string>();
  
  tasks.forEach(task => {
    task.labels.forEach(label => {
      if (label.startsWith("blocked-by-")) {
        blockedByLabels.add(label);
      }
    });
  });
  
  return Array.from(blockedByLabels);
}

function getTaskNameFromBlockedLabel(label: string): string {
  return label.replace("blocked-by-", "");
}

async function processGoalTasks(api: TodoistApiClient) {
  const tasks = await api.getTasks();
  const goalTasksWithoutSubtasks = findGoalTasksWithoutSubtasks(tasks);
  
  for (const goalTask of goalTasksWithoutSubtasks) {
    console.log(`Processing goal task: ${goalTask.content}`);
    
    // @non-milestoneタグを追加
    const updatedLabels = [...goalTask.labels, "non-milestone"];
    await api.updateTask(goalTask.id, { labels: updatedLabels });
    
    // マイルストーンタスクを子として作成
    const milestoneContent = `${goalTask.content}のマイルストーンを置く`;
    await api.createTask(milestoneContent, {
      parent_id: goalTask.id
    });
    
    console.log(`Added @non-milestone tag and created milestone task for: ${goalTask.content}`);
  }
}

async function processNonMilestoneTasks(api: TodoistApiClient) {
  const tasks = await api.getTasks();
  const nonMilestoneTasksWithTaskChildren = findNonMilestoneTasksWithTaskChildren(tasks);
  
  for (const task of nonMilestoneTasksWithTaskChildren) {
    console.log(`Removing @non-milestone from task: ${task.content}`);
    
    // @non-milestoneタグを削除
    const updatedLabels = task.labels.filter(label => label !== "non-milestone");
    await api.updateTask(task.id, { labels: updatedLabels });
    
    console.log(`Removed @non-milestone tag from: ${task.content}`);
  }
}

async function processBlockedByLabels(api: TodoistApiClient) {
  const tasks = await api.getTasks();
  const existingLabels = await api.getLabels();
  const blockedByLabels = extractBlockedByLabels(tasks);
  
  // 新しい@blocked-by-ラベルをアカウントに追加
  for (const labelName of blockedByLabels) {
    const existingLabel = existingLabels.find(label => label.name === labelName);
    if (!existingLabel) {
      await api.createLabel(labelName, "red");
      console.log(`Created label: ${labelName}`);
    }
  }
  
  // 存在しないタスクの@blocked-by-ラベルを削除
  const existingBlockedLabels = existingLabels.filter(label => 
    label.name.startsWith("blocked-by-")
  );
  
  for (const label of existingBlockedLabels) {
    const taskName = getTaskNameFromBlockedLabel(label.name);
    const taskExists = tasks.some(task => task.content === taskName);
    
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
    
    const api = new TodoistApiClient(token);
    
    await processGoalTasks(api);
    await processNonMilestoneTasks(api);
    await processBlockedByLabels(api);
    
    console.log(`[${new Date().toISOString()}] Automation completed successfully`);
  } catch (error) {
    console.error("Error in automation:", error);
  }
}

// 初回実行
runAutomation();

// 1時間おきに実行
setInterval(runAutomation, 60 * 60 * 1000);

console.log("Todoist automation service started - running every hour");