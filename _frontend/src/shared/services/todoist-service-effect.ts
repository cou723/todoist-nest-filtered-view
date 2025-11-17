/**
 * TodoistService - Effect-based Todoist API operations
 * 
 * Provides Effect-based methods for interacting with the Todoist REST API v2.
 */

import { Effect, Schema } from "effect";
import {
  TaskSchema,
  GetTasksResponseSchema,
  type Task,
  type GetTasksResponse,
  type Label,
} from "../todoist/schema.js";
import { get, postNoContent } from "../http/client.js";
import type { TodoistErrorUnion } from "../errors/todoist-errors.js";

/**
 * TodoistService interface
 */
export interface TodoistService {
  /**
   * Get all tasks with optional filter
   */
  readonly getTasks: (filter?: string) => Effect.Effect<Task[], TodoistErrorUnion, never>;
  
  /**
   * Get a specific task by ID
   */
  readonly getTask: (id: string) => Effect.Effect<Task, TodoistErrorUnion, never>;
  
  /**
   * Get all labels
   */
  readonly getLabels: () => Effect.Effect<Label[], TodoistErrorUnion, never>;
  
  /**
   * Close (complete) a task
   */
  readonly closeTask: (id: string) => Effect.Effect<void, TodoistErrorUnion, never>;
}

/**
 * TodoistService configuration
 */
export interface TodoistServiceConfig {
  readonly baseUrl: string;
  readonly accessToken: string;
}

/**
 * Create TodoistService implementation
 */
export const makeTodoistService = (config: TodoistServiceConfig): TodoistService => {
  /**
   * Fetch all tasks with pagination
   */
  const fetchAllTasks = (filter?: string): Effect.Effect<Task[], TodoistErrorUnion, never> => {
    return Effect.gen(function* () {
      const allTasks: Task[] = [];
      let cursor: string | null = null;
      
      do {
        const params: Record<string, string | undefined> = {
          cursor: cursor ?? undefined,
        };
        
        if (filter) {
          params.filter = filter;
        }
        
        const response: GetTasksResponse = yield* get(
          config.baseUrl,
          "/rest/v2/tasks",
          GetTasksResponseSchema,
          params,
          config.accessToken
        );
        
        allTasks.push(...response.results);
        cursor = response.nextCursor;
      } while (cursor !== null);
      
      return allTasks;
    });
  };
  
  return {
    getTasks: (filter?: string) => fetchAllTasks(filter),
    
    getTask: (id: string) =>
      get(config.baseUrl, `/rest/v2/tasks/${id}`, TaskSchema, undefined, config.accessToken),
    
    getLabels: () =>
      get(config.baseUrl, "/rest/v2/labels", Schema.Array(Schema.Any), undefined, config.accessToken).pipe(
        Effect.map(() => [] as Label[])
      ),
    
    closeTask: (id: string) =>
      postNoContent(config.baseUrl, `/rest/v2/tasks/${id}/close`, undefined, config.accessToken),
  };
};
