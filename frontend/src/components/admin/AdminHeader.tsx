import { useAdminStore } from '../../stores/adminStore';

export function AdminHeader() {
  const user = useAdminStore((state) => state.user);

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">Panel de Administración</h2>
      <div className="flex items-center space-x-4">
        <div className="flex flex-col text-right">
          <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
