import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Settings, LogOut, MapPin } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useOrders } from '../hooks/useOrders';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatDate } from '../lib/utils';

export function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'settings'>('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-display">Mis Pedidos</h2>
            {isLoadingOrders ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-background-surface border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                      <div>
                        <p className="font-bold text-lg text-text-primary">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                        {order.status === 'pending'
                          ? 'Pendiente'
                          : order.status === 'paid'
                            ? 'Pagado'
                            : order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
                      <p className="font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <Package className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                <p className="text-text-secondary mb-4">No tienes pedidos recientes.</p>
                <Button onClick={() => navigate('/products')}>Ir a comprar</Button>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-display">Configuración</h2>
            <div className="bg-white border border-neutral-200 dark:bg-neutral-200 dark:border-neutral-700 rounded-xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    disabled
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 dark:bg-neutral-900/50 dark:border-neutral-600 dark:text-neutral-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 dark:bg-neutral-900/50 dark:border-neutral-600 dark:text-neutral-400"
                  />
                </div>
              </div>
              <Button disabled>Guardar Cambios</Button>
            </div>
          </div>
        );

      case 'overview':
      default:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold font-display">Hola, {user.name}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="bg-primary/5 p-6 rounded-xl border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setActiveTab('orders')}
              >
                <Package className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-1">Pedidos</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {orders?.length || 0} pedidos realizados
                </p>
              </div>
              <div className="bg-background-surface p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <MapPin className="w-8 h-8 text-text-secondary mb-4" />
                <h3 className="font-bold text-lg mb-1 text-text-primary">Direcciones</h3>
                <p className="text-sm text-text-secondary">Gestión de envíos</p>
              </div>
              <div className="bg-background-surface p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <User className="w-8 h-8 text-text-secondary mb-4" />
                <h3 className="font-bold text-lg mb-1 text-text-primary">Perfil</h3>
                <p className="text-sm text-text-secondary">Datos personales</p>
              </div>
            </div>

            {/* Recent Order Preview */}
            {orders && orders.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-text-primary">Último Pedido</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                    Ver todos
                  </Button>
                </div>
                <div className="bg-background-surface border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-text-primary">
                        #{orders[0].id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {formatDate(orders[0].created_at)}
                      </p>
                    </div>
                    <Badge>{orders[0].status}</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-100'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <User className="w-4 h-4" />
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-100'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Mis Pedidos
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-neutral-900 text-white dark:bg-neutral-200 dark:text-neutral-100'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>

          <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}
