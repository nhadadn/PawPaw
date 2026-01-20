import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Modal } from '../../components/ui/Modal';
import { OrderDetails } from '../../components/admin/OrderDetails';
import type { AdminOrder } from '../../types/admin';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Eye } from 'lucide-react';

export function AdminOrders() {
  const {
    orders,
    isLoading,
    error,
    updateOrderStatus,
  } = useAdminOrders();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const statusColors: Record<AdminOrder['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    processing: 'outline',
    shipped: 'default',
    delivered: 'default',
    cancelled: 'destructive',
  };

  const columns: Column<AdminOrder>[] = [
    {
      header: 'ID Orden',
      accessorKey: 'id',
      cell: (order) => <span className="font-mono text-xs">{order.id.slice(0, 8)}...</span>
    },
    {
      header: 'Cliente',
      cell: (order) => (
        <div>
            <div className="font-medium">{order.user?.name || 'Invitado'}</div>
            <div className="text-xs text-gray-500">{order.user?.email}</div>
        </div>
      )
    },
    {
      header: 'Fecha',
      cell: (order) => new Date(order.createdAt).toLocaleDateString(),
    },
    {
      header: 'Total',
      cell: (order) => formatCurrency(order.total),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: (order) => (
        <Badge variant={statusColors[order.status]}>
          {order.status}
        </Badge>
      ),
    },
    {
        header: 'Acciones',
        cell: (order) => (
            <button
                onClick={() => handleViewDetails(order)}
                className="text-gray-500 hover:text-primary transition-colors"
                title="Ver Detalles"
            >
                <Eye className="w-5 h-5" />
            </button>
        )
    }
  ];

  const handleViewDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (id: string, status: AdminOrder['status']) => {
    setActionError(null);
    try {
      await updateOrderStatus(id, status);
      // Update local state to reflect change immediately in modal
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status });
      }
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
        <h1 className="text-2xl font-semibold text-gray-900">Órdenes</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles de la Orden"
      >
        {actionError && (
          <div className="mb-4">
            <Alert variant="error">{actionError}</Alert>
          </div>
        )}
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onStatusChange={handleStatusChange}
            onClose={() => setIsModalOpen(false)}
            isLoading={isLoading}
          />
        )}
      </Modal>
    </div>
  );
}
