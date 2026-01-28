import { useAdminStore } from '../../stores/adminStore';

export function AdminHeader() {
  const user = useAdminStore((state) => state.user);

  return (
    <header className="bg-background-surface shadow-sm h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800">
      <h2 className="text-lg font-semibold text-text-primary">Panel de Administración</h2>
      <div className="flex items-center space-x-4">
        <div className="flex flex-col text-right">
          <span className="text-sm font-medium text-text-primary">{user?.name}</span>
          <span className="text-xs text-text-secondary">{user?.email}</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
