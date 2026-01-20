import { useState } from 'react';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import type { AdminUser } from '../../types/admin';
import { UserCog } from 'lucide-react';

export function AdminUsers() {
  const {
    users,
    isLoading,
    error,
    updateUserRole,
    updateUserStatus,
  } = useAdminUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const roleColors: Record<AdminUser['role'], 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    customer: 'secondary',
  };

  const statusColors: Record<AdminUser['status'], 'default' | 'destructive'> = {
    active: 'default',
    inactive: 'destructive',
  };

  const columns: Column<AdminUser>[] = [
    {
      header: 'Usuario',
      cell: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-gray-500 text-xs">{user.email}</div>
        </div>
      ),
    },
    {
      header: 'Rol',
      accessorKey: 'role',
      cell: (user) => (
        <Badge variant={roleColors[user.role]}>
          {user.role}
        </Badge>
      ),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (user) => (
        <Badge variant={statusColors[user.status]}>
          {user.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      header: 'Fecha Registro',
      cell: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
        header: 'Acciones',
        cell: (user) => (
            <button
                onClick={() => handleManageUser(user)}
                className="text-gray-500 hover:text-primary transition-colors"
                title="Administrar Usuario"
            >
                <UserCog className="w-5 h-5" />
            </button>
        )
    }
  ];

  const handleManageUser = (user: AdminUser) => {
    setSelectedUser(user);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleRoleChange = async (role: AdminUser['role']) => {
    if (!selectedUser) return;
    setActionError(null);
    try {
      await updateUserRole(selectedUser.id, role);
      setSelectedUser({ ...selectedUser, role });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Error desconocido');
      }
    }
  };

  const handleStatusChange = async (status: AdminUser['status']) => {
    if (!selectedUser) return;
    setActionError(null);
    try {
      await updateUserStatus(selectedUser.id, status);
      setSelectedUser({ ...selectedUser, status });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Error desconocido');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Administrar Usuario"
      >
        {actionError && (
          <div className="mb-4">
            <Alert variant="error">{actionError}</Alert>
          </div>
        )}
        
        {selectedUser && (
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-900">Información</h3>
                    <p className="text-sm text-gray-500">{selectedUser.name} ({selectedUser.email})</p>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Rol</h3>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant={selectedUser.role === 'admin' ? 'primary' : 'outline'}
                            onClick={() => handleRoleChange('admin')}
                            disabled={isLoading}
                        >
                            Admin
                        </Button>
                        <Button 
                            size="sm" 
                            variant={selectedUser.role === 'customer' ? 'primary' : 'outline'}
                            onClick={() => handleRoleChange('customer')}
                            disabled={isLoading}
                        >
                            Cliente
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Estado</h3>
                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant={selectedUser.status === 'active' ? 'primary' : 'outline'}
                            onClick={() => handleStatusChange('active')}
                            disabled={isLoading}
                        >
                            Activo
                        </Button>
                        <Button 
                            size="sm" 
                            variant={selectedUser.status === 'inactive' ? 'danger' : 'outline'}
                            onClick={() => handleStatusChange('inactive')}
                            disabled={isLoading}
                        >
                            Inactivo
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                        Cerrar
                    </Button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
}
