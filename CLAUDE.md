# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a fullstack Todoist task list application split into two main parts:

### Frontend (`frontend/`)
- **Tech Stack**: Lit (Web Components), TypeScript, Vite
- **Architecture**: Controller-based reactive pattern using Lit's ReactiveController
- **Key Controllers**:
  - `AuthController`: Manages OAuth authentication state and token storage
  - `TaskController`: Handles Todoist task fetching, caching, and operations
  - `FilterController`: Manages task filtering and query state
- **Services**: 
  - `TodoistService`: Core API wrapper around @doist/todoist-api-typescript
  - `OAuthService`: Handles OAuth flow with proxy server
  - `ThemeService`: Dark/light theme management

### Proxy Server (`proxy/`)
- **Tech Stack**: Deno, TypeScript
- **Purpose**: OAuth proxy to handle CORS and secure client secret
- **Endpoints**:
  - `/oauth/token`: Exchanges authorization code for access token
  - `/oauth/revoke`: Revokes access tokens
- **Deployment**: Deno Deploy

## Development Commands

### Frontend
```bash
cd frontend
pnpm install           # Install dependencies
pnpm dev              # Start dev server (port 5173)
pnpm build            # Build for production
pnpm type-check       # TypeScript type checking
pnpm lint             # ESLint code checking
pnpm test             # Run tests with Vitest
```

### Proxy Server
```bash
cd proxy
deno task dev         # Start dev server with watch mode (port 8000)
deno task start       # Start production server
deno task fmt         # Format code
deno task lint        # Lint code
deno task check       # Type check
```

### Development Workflow
- Use `./dev.sh` from root to start both frontend and proxy concurrently
- Frontend runs on http://localhost:5173
- Proxy runs on http://localhost:8000

## Key Implementation Details

### Task Data Structure
Tasks are enhanced with parent task information using a recursive `TaskNode` type that includes the full parent chain for nested task display.

### Authentication Flow
1. Frontend initiates OAuth flow with Todoist
2. Proxy server handles token exchange using stored client secret
3. Tokens are stored in localStorage and managed by AuthController

### Task Caching
TodoistService implements intelligent caching:
- 5-minute cache duration for API responses
- Task hierarchy is built recursively with parent task fetching
- Cache is cleared on task completion operations

### Component Architecture
- Uses Lit's reactive controller pattern for state management
- All components are custom elements following kebab-case naming
- UI components are in `components/ui/` for reusability
- Task-specific components use composition pattern

### Environment Requirements
- Node.js 18+ and pnpm for frontend
- Deno for proxy server
- Environment variables needed for OAuth configuration