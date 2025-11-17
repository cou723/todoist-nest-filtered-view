# Shared Services and Domain Layer

This directory contains the Effect-based common infrastructure for the Todoist application.

## Directory Structure

```
shared/
├── todoist/          # Domain schemas for Todoist entities
│   ├── schema.ts     # Effect Schema definitions
│   └── __tests__/    # Schema validation tests
├── services/         # Effect-based service implementations
│   ├── todoist-service-effect.ts   # Task and label operations
│   ├── stats-service-effect.ts     # Completion statistics
│   └── auth-service-effect.ts      # OAuth authentication
├── http/            # HTTP client utilities
│   └── client.ts    # Fetch-based HTTP client with Effect
├── errors/          # Common error types
│   └── todoist-errors.ts  # Error hierarchy for Todoist operations
└── logging/         # Logging utilities
    └── logger.ts    # Effect-based logging
```

## Overview

### Schemas (`todoist/schema.ts`)

Defines all Todoist domain types using Effect Schema for runtime validation:

- **TaskSchema**: Complete task object with all fields
- **DueSchema**: Task due date information
- **LabelSchema**: Label/tag definition
- **CompletedTaskItemSchema**: Completed task from Sync API v1
- **OAuthTokenResponseSchema**: OAuth token exchange response
- **DailyCompletionStatSchema**: Daily statistics
- **TodayTaskStatSchema**: Today's statistics
- **GoalStatsSchema**: Goal milestone statistics

All schemas provide automatic runtime validation and TypeScript type inference.

### Services

#### TodoistService (`services/todoist-service-effect.ts`)

Provides Effect-based operations for Todoist REST API v2:

```typescript
interface TodoistService {
  getTasks: (filter?: string) => Effect<Task[], TodoistErrorUnion, never>;
  getTask: (id: string) => Effect<Task, TodoistErrorUnion, never>;
  getLabels: () => Effect<Label[], TodoistErrorUnion, never>;
  closeTask: (id: string) => Effect<void, TodoistErrorUnion, never>;
}
```

**Usage:**
```typescript
import { makeTodoistService } from "./services/todoist-service-effect.js";

const service = makeTodoistService({
  baseUrl: "https://api.todoist.com",
  accessToken: "YOUR_TOKEN",
});

// Fetch all goal tasks
const goalTasks = await Effect.runPromise(
  service.getTasks("@goal")
);
```

#### StatsService (`services/stats-service-effect.ts`)

Handles completion statistics via proxy API:

```typescript
interface StatsService {
  getCompletedTasks: (
    since: string,
    until: string
  ) => Effect<CompletedTaskItem[], TodoistErrorUnion, never>;
  
  getDailyCompletionStats: (
    days: number
  ) => Effect<DailyCompletionStat[], TodoistErrorUnion, never>;
  
  getTodayStats: () => Effect<TodayTaskStat, TodoistErrorUnion, never>;
}
```

**Usage:**
```typescript
import { makeStatsService } from "./services/stats-service-effect.js";

const service = makeStatsService({
  proxyUrl: "https://proxy.example.com",
  accessToken: "YOUR_TOKEN",
});

// Fetch daily completion stats for 90 days
const stats = await Effect.runPromise(
  service.getDailyCompletionStats(90)
);
```

#### AuthService (`services/auth-service-effect.ts`)

Manages OAuth authentication flow:

```typescript
interface AuthService {
  exchangeCodeForToken: (
    code: string,
    clientId: string,
    redirectUri: string
  ) => Effect<OAuthTokenResponse, TodoistErrorUnion, never>;
  
  revokeToken: (
    accessToken: string,
    clientId: string
  ) => Effect<void, TodoistErrorUnion, never>;
}
```

**Usage:**
```typescript
import { makeAuthService } from "./services/auth-service-effect.js";

const service = makeAuthService({
  proxyUrl: "https://proxy.example.com",
});

// Exchange authorization code
const tokenResponse = await Effect.runPromise(
  service.exchangeCodeForToken(code, clientId, redirectUri)
);
```

### HTTP Client (`http/client.ts`)

Simplified fetch-based HTTP client for Effect operations:

```typescript
// GET request with schema validation
const data = await Effect.runPromise(
  get(
    "https://api.example.com",
    "/endpoint",
    MySchema,
    { param: "value" },
    "access_token"
  )
);

// POST request
const result = await Effect.runPromise(
  post(
    "https://api.example.com",
    "/endpoint",
    ResponseSchema,
    { data: "payload" },
    "access_token"
  )
);

// POST without response body
await Effect.runPromise(
  postNoContent(
    "https://api.example.com",
    "/endpoint",
    { data: "payload" },
    "access_token"
  )
);
```

### Error Types (`errors/todoist-errors.ts`)

Comprehensive error hierarchy for Todoist operations:

- **TodoistError**: Base error type
- **AuthenticationError**: 401 authentication errors
- **AuthorizationError**: 403 permission errors
- **NotFoundError**: 404 resource not found
- **BadRequestError**: 400 invalid request
- **NetworkError**: Network/connection errors
- **ValidationError**: Schema validation failures
- **RateLimitError**: 429 rate limiting
- **ServerError**: 5xx server errors

**TodoistErrorUnion**: Union type of all errors for type safety

**Error handling example:**
```typescript
const program = service.getTasks().pipe(
  Effect.match({
    onFailure: (error) => {
      if (error._tag === "AuthenticationError") {
        console.log("Please log in again");
      }
      return [];
    },
    onSuccess: (tasks) => tasks,
  })
);
```

### Logging (`logging/logger.ts`)

Effect-based structured logging:

```typescript
import { createLogger, logEffect } from "./logging/logger.js";

// Create contextual logger
const logger = createLogger({
  service: "TodoistService",
  operation: "getTasks",
});

// Log messages
await Effect.runPromise(logger.info("Fetching tasks"));

// Wrap effects with logging
const program = logEffect({
  service: "TodoistService",
  operation: "getTasks",
})(service.getTasks());
```

## Testing

All schemas and core functionality are tested:

```bash
pnpm test
```

Test coverage includes:
- ✅ Schema validation (valid and invalid inputs)
- ✅ Type safety verification
- ✅ Error handling patterns
- ✅ Response validation

## Design Principles

1. **Type Safety**: All domain types are defined with Effect Schema for runtime validation
2. **Error Handling**: Comprehensive error types with clear semantics
3. **Composability**: Services return Effects that can be composed and transformed
4. **Separation of Concerns**: Clear separation between domain, services, and infrastructure
5. **Minimal Dependencies**: Simple fetch-based HTTP client, no heavy frameworks

## Integration with Existing Code

The Effect-based services can coexist with existing services:

```typescript
// Legacy service
import { TodoistService as LegacyService } from "../services/todoist-service.js";

// Effect service
import { makeTodoistService } from "./shared/services/todoist-service-effect.js";

// Use Effect service for new code
const effectService = makeTodoistService(config);
const tasks = await Effect.runPromise(effectService.getTasks());

// Existing code continues to work
const legacyService = new LegacyService(token);
const legacyTasks = await legacyService.getTodosTree();
```

## Migration Path

To gradually adopt Effect services:

1. **Phase 1**: Use Effect services for new features
2. **Phase 2**: Wrap existing services with Effect adapters
3. **Phase 3**: Migrate critical paths to Effect services
4. **Phase 4**: Complete migration and remove legacy services

## Dependencies

- `effect`: Core Effect library with Schema
- `@effect/platform`: Platform-specific utilities (installed but not required with fetch-based client)
- `date-fns`: Date manipulation utilities

## Documentation

See `/docs/effect-services-api-examples.md` for detailed API examples and patterns.

## Future Enhancements

- [ ] Add request caching layer
- [ ] Implement rate limiting protection
- [ ] Add metrics collection
- [ ] Support for batch operations
- [ ] WebSocket support for real-time updates
