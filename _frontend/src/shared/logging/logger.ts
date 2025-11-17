/**
 * Logging Strategy
 * 
 * Provides structured logging for Effect-based operations.
 */

import { Effect, LogLevel } from "effect";

/**
 * Log levels
 */
export type AppLogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log context
 */
export interface LogContext {
  readonly service?: string;
  readonly operation?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Create a contextual logger
 */
export const createLogger = (context: LogContext) => {
  const prefix = [context.service, context.operation]
    .filter(Boolean)
    .join(".");
  
  return {
    debug: (message: string, metadata?: Record<string, unknown>) =>
      Effect.log(
        `[${prefix}] ${message}`,
        { ...context.metadata, ...metadata }
      ).pipe(Effect.withLogSpan("debug")),
    
    info: (message: string, metadata?: Record<string, unknown>) =>
      Effect.log(
        `[${prefix}] ${message}`,
        { ...context.metadata, ...metadata }
      ).pipe(Effect.withLogSpan("info")),
    
    warn: (message: string, metadata?: Record<string, unknown>) =>
      Effect.logWarning(
        `[${prefix}] ${message}`,
        { ...context.metadata, ...metadata }
      ),
    
    error: (message: string, error?: unknown, metadata?: Record<string, unknown>) =>
      Effect.logError(
        `[${prefix}] ${message}`,
        error,
        { ...context.metadata, ...metadata }
      ),
  };
};

/**
 * Get minimum log level based on environment
 */
export const getLogLevel = (): LogLevel.LogLevel => {
  return import.meta.env.DEV ? LogLevel.Debug : LogLevel.Info;
};

/**
 * Helper to log Effect execution
 */
export const logEffect = <A, E, R>(
  context: LogContext
) => {
  const logger = createLogger(context);
  
  return <T extends Effect.Effect<A, E, R>>(effect: T): T => {
    return effect.pipe(
      Effect.tap(() => logger.debug("Starting operation")),
      Effect.tap((result) =>
        logger.info("Operation completed successfully", {
          result: typeof result === "object" ? "object" : result,
        })
      ),
      Effect.tapError((error) =>
        logger.error("Operation failed", error, {
          error: error instanceof Error ? error.message : String(error),
        })
      )
    ) as T;
  };
};
