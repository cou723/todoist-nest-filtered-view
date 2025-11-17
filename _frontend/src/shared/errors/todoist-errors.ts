/**
 * Common Error Types for Todoist Operations
 * 
 * Defines a hierarchy of error types that can occur during Todoist API interactions.
 */

import { Data } from "effect";

/**
 * Base class for all Todoist-related errors
 */
export class TodoistError extends Data.TaggedError("TodoistError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends Data.TaggedError("AuthenticationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Authorization/Permission errors (403)
 */
export class AuthorizationError extends Data.TaggedError("AuthorizationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly message: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly cause?: unknown;
}> {}

/**
 * Bad request errors (400)
 */
export class BadRequestError extends Data.TaggedError("BadRequestError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Network/connection errors
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Schema validation errors
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly errors?: unknown;
  readonly cause?: unknown;
}> {}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly cause?: unknown;
}> {}

/**
 * Server errors (5xx)
 */
export class ServerError extends Data.TaggedError("ServerError")<{
  readonly message: string;
  readonly statusCode: number;
  readonly cause?: unknown;
}> {}

/**
 * Type guard to check if an error is a Todoist error
 */
export const isTodoistError = (error: unknown): error is TodoistError => {
  return error instanceof TodoistError;
};

/**
 * Union type of all Todoist errors
 */
export type TodoistErrorUnion =
  | TodoistError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | BadRequestError
  | NetworkError
  | ValidationError
  | RateLimitError
  | ServerError;

/**
 * Helper to create error from HTTP response
 */
export const createErrorFromResponse = (
  statusCode: number,
  message: string,
  cause?: unknown
): TodoistErrorUnion => {
  switch (statusCode) {
    case 400:
      return new BadRequestError({ message, cause });
    case 401:
      return new AuthenticationError({ message, cause });
    case 403:
      return new AuthorizationError({ message, cause });
    case 404:
      return new NotFoundError({ 
        message, 
        resourceType: "unknown",
        cause 
      });
    case 429:
      return new RateLimitError({ message, cause });
    default:
      if (statusCode >= 500) {
        return new ServerError({ message, statusCode, cause });
      }
      return new TodoistError({ message, cause });
  }
};
