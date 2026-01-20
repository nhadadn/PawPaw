# Admin UI Components

## Layout Components

### AdminLayout
Main layout wrapper for authenticated admin pages.
- Checks authentication state
- Renders `AdminSidebar` and `AdminHeader`
- Handles navigation protection

### AdminSidebar
Navigation sidebar for the admin panel.
- Links to: Dashboard, Products, Categories, Orders, Inventory, Users
- Handles active state styling
- Includes Logout button

### AdminHeader
Top header bar.
- Displays current user info (Name, Email)
- Shows user avatar/initial

## Dashboard Components

### MetricsCard
Displays key metrics with support for trends.
- Props:
  - `title`: string
  - `value`: string | number
  - `icon`: LucideIcon
  - `trend`: { value: number, isPositive: boolean } (optional)
  - `className`: string (optional)

## Data Display Components

### DataTable
Reusable table component for CRUD pages.
- Props:
  - `data`: Array of T
  - `columns`: Array of Column<T>
  - `isLoading`: boolean
- Features:
  - Generic typing support
  - Loading skeleton
  - Empty state handling
  - Custom cell rendering

### OrderDetails
Component to display full order details in a modal.
- Props:
  - `order`: AdminOrder
  - `onStatusChange`: Function to update order status
  - `onClose`: Function to close the modal
  - `isLoading`: boolean

## Form Components

### ProductForm
Form for creating and editing products.
- Props:
  - `initialData`: AdminProduct (optional)
  - `onSubmit`: Function dealing with FormData
  - `isLoading`: boolean
  - `onCancel`: Function to cancel operation
- Features:
  - File upload support
  - Validation
  - Pre-filling for edit mode

### CategoryForm
Form for creating and editing categories.
- Props:
  - `initialData`: AdminCategory (optional)
  - `onSubmit`: Function dealing with FormData
  - `isLoading`: boolean
  - `onCancel`: Function to cancel operation

## UI Components Used
- `Alert`: For displaying errors/messages
- `Spinner`: For loading states
- `Button`: Standard button component
- `Input`: Standard input component
- `Badge`: Status/Role indicators
- `Modal`: Dialog for forms and details
