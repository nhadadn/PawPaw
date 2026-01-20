# Admin UI Implementation Details

## Architecture

### State Management
We use **Zustand** for global admin state management (`useAdminStore`).
- **Persist Middleware**: Admin session is persisted in `localStorage` under `admin-storage`.
- **State**:
  - `isAuthenticated`: boolean
  - `token`: string | null
  - `user`: AdminUser | null

### Authentication
- **Login Flow**:
  1. User enters credentials in `/admin/login`.
  2. `useAdminAuth` hook calls `POST /api/admin/login`.
  3. On success, token and user info are stored in Zustand.
  4. Redirect to `/admin/dashboard`.
- **Protection**:
  - `AdminLayout` checks `isAuthenticated`.
  - Redirects to `/admin/login` if false.
- **Axios Interceptor**:
  - `adminClient` adds `Authorization: Bearer <token>` to all requests.
  - Handles 401 errors by dispatching `admin:unauthorized` event (can be hooked to logout).

### Routing
Admin routes are nested under `/admin`.
- `/admin/login` (Public)
- `/admin/*` (Protected by `AdminLayout`)
  - `/dashboard`
  - `/products` (CRUD)
  - `/categories` (CRUD)
  - `/orders` (Status Management)
  - `/inventory` (Stock Management)
  - `/users` (Role/Status Management)

## API Integration
- Dedicated `adminClient` instance (separate from public client to ensure separation of concerns and interceptors).
- Hooks pattern:
  - `useAdminAuth`: Login logic
  - `useAdminStats`: Dashboard metrics fetching
  - `useAdminProducts`: CRUD operations for products (Supports FormData)
  - `useAdminCategories`: CRUD operations for categories (Supports FormData)
  - `useAdminOrders`: Order fetching and status updates
  - `useAdminInventory`: Stock management
  - `useAdminUsers`: User role and status management

## Testing
- **E2E (Cypress)**:
  - `admin.cy.ts`: Covers login, auth protection, navigation, logout, and CRUD flows for Products/Categories/Orders/Inventory/Users.
- **Unit (Vitest)**:
  - `MetricsCard.test.tsx`: Component rendering.
  - `AdminSidebar.test.tsx`: Navigation rendering.
  - `useAdminOrders.test.ts`: Hook logic testing.
  - `useAdminInventory.test.ts`: Hook logic testing.
