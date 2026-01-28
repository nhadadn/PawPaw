import type { AdminOrder } from '../../types/admin';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface OrderDetailsProps {
  order: AdminOrder;
  onStatusChange: (id: string, status: AdminOrder['status']) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export function OrderDetails({ order, onStatusChange, onClose, isLoading }: OrderDetailsProps) {
  const statusColors: Record<
    AdminOrder['status'],
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    pending: 'secondary',
    processing: 'outline',
    shipped: 'default',
    delivered: 'default', // Using default (usually primary color) for delivered instead of success if not available
    cancelled: 'destructive',
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Orden #{order.id}</h3>
          <p className="text-sm text-text-secondary">
            Realizada el {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusColors[order.status]}>{order.status.toUpperCase()}</Badge>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-text-primary">Cliente</h4>
          <p className="text-sm text-text-secondary">{order.user?.name || 'Invitado'}</p>
          <p className="text-sm text-text-secondary">{order.user?.email}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-text-primary">Envío</h4>
          {order.shippingAddress ? (
            <p className="text-sm text-text-secondary">
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zip}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">No especificado</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-2">Productos</h4>
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  Producto
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Precio
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Cant.
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-background-surface divide-y divide-neutral-200 dark:divide-neutral-800">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-text-primary">{item.name}</td>
                  <td className="px-4 py-2 text-sm text-text-secondary text-right">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-4 py-2 text-sm text-text-secondary text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 text-sm text-text-primary text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-2 text-sm font-medium text-text-primary text-right"
                >
                  Total
                </td>
                <td className="px-4 py-2 text-sm font-bold text-text-primary text-right">
                  {formatCurrency(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <h4 className="text-sm font-medium text-text-primary mb-2">Actualizar Estado</h4>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={order.status === status ? 'primary' : 'outline'}
                onClick={() => onStatusChange(order.id, status)}
                disabled={isLoading || order.status === status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            )
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
