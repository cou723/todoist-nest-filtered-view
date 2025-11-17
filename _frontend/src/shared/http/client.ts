/**
 * HTTP Client for Todoist API
 * 
 * Simplified HTTP client using native fetch for better compatibility.
 */

import { Effect, Schema } from "effect";
import {
  createErrorFromResponse,
  NetworkError,
  ValidationError,
  type TodoistErrorUnion,
} from "../errors/todoist-errors.js";

/**
 * HTTP Client Configuration
 */
export interface HttpClientConfig {
  readonly baseUrl: string;
  readonly accessToken?: string;
}

/**
 * Create request headers
 */
const createHeaders = (accessToken?: string): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  return headers;
};

/**
 * Execute fetch with error handling
 */
const executeFetch = (url: string, init: RequestInit): Effect.Effect<Response, TodoistErrorUnion, never> => {
  return Effect.tryPromise({
    try: () => fetch(url, init),
    catch: (error) =>
      new NetworkError({
        message: error instanceof Error ? error.message : "Network request failed",
        cause: error,
      }),
  });
};

/**
 * GET request helper
 */
export const get = <A, I, R>(
  baseUrl: string,
  path: string,
  schema: Schema.Schema<A, I, R>,
  params?: Record<string, string | undefined>,
  accessToken?: string
): Effect.Effect<A, TodoistErrorUnion, R> => {
  return Effect.gen(function* () {
    // Build URL with query parameters
    const url = new URL(path, baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }
    
    // Execute request
    const response = yield* executeFetch(url.toString(), {
      method: "GET",
      headers: createHeaders(accessToken),
    });
    
    // Check status
    if (!response.ok) {
      return yield* Effect.fail(
        createErrorFromResponse(response.status, `HTTP ${response.status}: ${response.statusText}`)
      );
    }
    
    // Parse JSON
    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) =>
        new NetworkError({
          message: "Failed to parse response JSON",
          cause: error,
        }),
    });
    
    // Validate with schema
    const parsed = yield* Schema.decodeUnknown(schema)(json).pipe(
      Effect.mapError((error) =>
        new ValidationError({
          message: "Response validation failed",
          errors: error,
          cause: error,
        })
      )
    );
    
    return parsed;
  });
};

/**
 * POST request helper
 */
export const post = <A, I, R>(
  baseUrl: string,
  path: string,
  schema: Schema.Schema<A, I, R>,
  body?: unknown,
  accessToken?: string
): Effect.Effect<A, TodoistErrorUnion, R> => {
  return Effect.gen(function* () {
    const url = new URL(path, baseUrl);
    
    // Execute request
    const response = yield* executeFetch(url.toString(), {
      method: "POST",
      headers: createHeaders(accessToken),
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Check status
    if (!response.ok) {
      return yield* Effect.fail(
        createErrorFromResponse(response.status, `HTTP ${response.status}: ${response.statusText}`)
      );
    }
    
    // Parse JSON
    const json = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) =>
        new NetworkError({
          message: "Failed to parse response JSON",
          cause: error,
        }),
    });
    
    // Validate with schema
    const parsed = yield* Schema.decodeUnknown(schema)(json).pipe(
      Effect.mapError((error) =>
        new ValidationError({
          message: "Response validation failed",
          errors: error,
          cause: error,
        })
      )
    );
    
    return parsed;
  });
};

/**
 * POST request without response body
 */
export const postNoContent = (
  baseUrl: string,
  path: string,
  body?: unknown,
  accessToken?: string
): Effect.Effect<void, TodoistErrorUnion, never> => {
  return Effect.gen(function* () {
    const url = new URL(path, baseUrl);
    
    // Execute request
    const response = yield* executeFetch(url.toString(), {
      method: "POST",
      headers: createHeaders(accessToken),
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Check status
    if (!response.ok) {
      return yield* Effect.fail(
        createErrorFromResponse(response.status, `HTTP ${response.status}: ${response.statusText}`)
      );
    }
  });
};
