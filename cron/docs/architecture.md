# Architecture Documentation

This project follows a **Layered Architecture** inspired by **Domain-Driven Design (DDD)** and **Clean Architecture** principles. The goal is to separate business logic from technical details (like external APIs) and to make the system more testable and maintainable.

## Directory Structure

### `src/domain/` (Domain Layer)
The core of the application. It contains the business logic and rules. **This layer has NO dependencies on other layers.**

- **`model/`**: Contains **Entities**, **Value Objects**, and **Domain Services**.
    - Entities represent objects with identity and lifecycle (e.g., a Task).
    - Value Objects represent immutable attributes or concepts (e.g., a Label, an ID).
    - First Class Collections handle logic related to a group of objects.
- **`repository/`**: Defines **Interfaces** for data access. It specifies *what* data operations are possible, but not *how* they are implemented.

### `src/application/` (Application Layer)
Orchestrates the domain objects to perform specific user tasks (Use Cases).

- **`usecase/`**: Contains classes that represent a specific business flow (e.g., "Assign Milestones", "Sync Dependency Labels"). These classes retrieve data via Repositories, manipulate Domain Entities, and save changes back.

### `src/infrastructure/` (Infrastructure Layer)
Provides the technical implementation of interfaces defined in the Domain layer.

- **`todoist/`**: Specific implementation for the Todoist platform.
    - **`repository/`**: Implements the Repository interfaces using the Todoist API. Handles caching, error handling, and API calls.
    - **`mapper/`**: Converts raw API data into Domain Entities and vice versa.

### `src/presentation/` (Presentation Layer)
The entry points of the application. It handles user input or trigger events and executes the appropriate Use Cases.

- **`cron/`**: Entry points for scheduled tasks.
- **`cli/`**: Entry points for command-line tools and debugging scripts.
