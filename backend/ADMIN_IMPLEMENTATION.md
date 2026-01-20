# Admin API Implementation

## Architecture
The Admin API follows the project's standard 3-layer architecture:
1.  **Controller (`admin.controller.ts`)**: Handles HTTP requests, validation (Zod), and responses.
2.  **Service (`admin.service.ts`)**: Implements business logic and data transformation (BigInt serialization).
3.  **Repository (`admin.repository.ts`)**: Manages database interactions via Prisma.

## Key Features
-   **Validation**: Uses `zod` for request body validation (`admin.schemas.ts`).
-   **Security**: Protected by `adminAuthMiddleware` which verifies JWT token and `admin` role.
-   **BigInt Handling**: Custom serialization in Service layer to convert Prisma `BigInt` to strings for JSON compatibility.
-   **Partial Updates**: Supports partial updates for PUT requests using Zod's `.partial()`.

## Database Interactions
-   **Prisma**: Used for all DB operations.
-   **Transactions**: Not explicitly used yet but recommended for complex inventory updates.
-   **Mocking**: Tests mock the Repository layer to isolate logic and avoid DB dependencies.

## Testing
-   **Integration Tests**: `admin.integration.test.ts` covers all endpoints.
-   **Coverage**: >10 tests covering happy paths, validation errors, and authentication.
-   **Mocking**: Uses `jest.mock` for Repository and `supertest` for HTTP requests.

## Setup
1.  Routes registered in `app.ts` under `/api/admin`.
2.  Swagger documentation available at `/api/docs`.
