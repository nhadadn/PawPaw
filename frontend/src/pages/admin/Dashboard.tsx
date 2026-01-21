import { useAdminStats } from '../../hooks/useAdminStats';
import { MetricsCard } from '../../components/admin/MetricsCard';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { DollarSign, ShoppingBag, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function AdminDashboard() {
  const { stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Ventas Totales"
          value={formatCurrency(stats.totalSales)}
          icon={DollarSign}
        />
        <MetricsCard
          title="Pedidos Totales"
          value={stats.totalOrders}
          icon={ShoppingBag}
        />
        <MetricsCard
          title="Usuarios Registrados"
          value={stats.totalUsers}
          icon={Users}
        />
        <MetricsCard
          title="Productos Stock Bajo"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          className={stats.lowStockProducts > 0 ? "border-l-4 border-red-500" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos Recientes</h3>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                    <div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos Más Vendidos</h3>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {stats.topProducts?.map((product) => (
                <li key={product.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {product.sales} ventas
                      </p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
