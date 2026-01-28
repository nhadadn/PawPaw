import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ShoppingBag, Users, Box, LogOut } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Productos', href: '/admin/products', icon: Package },
  { name: 'Categorías', href: '/admin/categories', icon: Tags },
  { name: 'Órdenes', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Inventario', href: '/admin/inventory', icon: Box },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
];

export function AdminSidebar() {
  const logout = useAdminStore((state) => state.logout);

  return (
    <div className="flex flex-col w-64 bg-background-surface min-h-screen border-r border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-center h-16 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-xl font-bold font-display text-text-primary">PawPaw Admin</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-text-secondary rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-100 hover:text-text-primary transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
