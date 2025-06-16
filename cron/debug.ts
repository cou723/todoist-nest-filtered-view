/**
 * Debug script to analyze actual Todoist API data
 */

import { Task, Label } from "https://esm.sh/@doist/todoist-api-typescript@3.0.2";

class TodoistApiClient {
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
}

function hasLabel(task: Task, labelName: string): boolean {
  return task.labels.includes(labelName);
}

function analyzeTaskData(tasks: Task[]) {
  console.log("=== Task Data Analysis ===");
  console.log(`Total tasks: ${tasks.length}`);
  
  // @goalラベルを持つタスクを分析
  const goalTasks = tasks.filter(task => hasLabel(task, "goal"));
  console.log(`\nGoal tasks: ${goalTasks.length}`);
  
  goalTasks.forEach(task => {
    console.log(`\nGoal Task: "${task.content}"`);
    console.log(`  ID: ${task.id}`);
    console.log(`  Labels: [${task.labels.join(', ')}]`);
    console.log(`  Parent ID: ${task.parentId || 'null'}`);
    
    // この@goalタスクの子タスクを探す
    const children = tasks.filter(t => t.parentId === task.id);
    console.log(`  Children: ${children.length}`);
    
    children.forEach(child => {
      console.log(`    - Child: "${child.content}"`);
      console.log(`      ID: ${child.id}`);
      console.log(`      Labels: [${child.labels.join(', ')}]`);
      console.log(`      Has @task: ${hasLabel(child, 'task')}`);
    });
  });
  
  // @taskラベルを持つタスクを分析
  const taskLabelTasks = tasks.filter(task => hasLabel(task, "task"));
  console.log(`\n@task labeled tasks: ${taskLabelTasks.length}`);
  
  taskLabelTasks.forEach(task => {
    console.log(`\nTask: "${task.content}"`);
    console.log(`  ID: ${task.id}`);
    console.log(`  Parent ID: ${task.parentId || 'null'}`);
    console.log(`  Labels: [${task.labels.join(', ')}]`);
    
    // 親タスクの情報
    if (task.parentId) {
      const parent = tasks.find(t => t.id === task.parentId);
      if (parent) {
        console.log(`  Parent: "${parent.content}"`);
        console.log(`  Parent has @goal: ${hasLabel(parent, 'goal')}`);
        console.log(`  Parent has @non-milestone: ${hasLabel(parent, 'non-milestone')}`);
      }
    }
  });
}

async function debugTaskData() {
  try {
    const token = Deno.env.get("TODOIST_TOKEN");
    if (!token) {
      throw new Error("TODOIST_TOKEN environment variable is required");
    }
    
    const api = new TodoistApiClient(token);
    const tasks = await api.getTasks();
    
    analyzeTaskData(tasks);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

debugTaskData();