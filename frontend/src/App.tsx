import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Loading } from './components/Loading';
import { ErrorBoundary, ErrorFallback } from './components/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

// Lazy Imports with Named Export Adapter
// Using the .then(module => ({ default: module.Component })) pattern to handle named exports
const Products = lazy(() =>
  import('./pages/Products').then((module) => ({ default: module.Products }))
);
const ProductDetail = lazy(() =>
  import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetail }))
);
const Cart = lazy(() => import('./pages/Cart').then((module) => ({ default: module.Cart })));
const Profile = lazy(() =>
  import('./pages/Profile').then((module) => ({ default: module.Profile }))
);
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const CheckoutPage = lazy(() =>
  import('./features/checkout/CheckoutPage').then((module) => ({ default: module.CheckoutPage }))
);

// Admin Lazy Imports
const AdminLayout = lazy(() =>
  import('./components/layout/AdminLayout').then((module) => ({ default: module.AdminLayout }))
);
const AdminLogin = lazy(() =>
  import('./pages/admin/Login').then((module) => ({ default: module.AdminLogin }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/Dashboard').then((module) => ({ default: module.AdminDashboard }))
);
const AdminProducts = lazy(() =>
  import('./pages/admin/Products').then((module) => ({ default: module.AdminProducts }))
);
const AdminCategories = lazy(() =>
  import('./pages/admin/Categories').then((module) => ({ default: module.AdminCategories }))
);
const AdminOrders = lazy(() =>
  import('./pages/admin/Orders').then((module) => ({ default: module.AdminOrders }))
);
const AdminInventory = lazy(() =>
  import('./pages/admin/Inventory').then((module) => ({ default: module.AdminInventory }))
);
const AdminUsers = lazy(() =>
  import('./pages/admin/Users').then((module) => ({ default: module.AdminUsers }))
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/cart"
            element={
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Cart />
              </ErrorBoundary>
            }
          />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Checkout Layout */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <AdminLayout />
            </ErrorBoundary>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
