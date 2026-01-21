import { useState } from 'react';
import { useAdminInventory } from '../../hooks/useAdminInventory';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import type { AdminInventoryItem } from '../../types/admin';
import { Edit } from 'lucide-react';
import { getImageUrl } from '../../lib/utils';

export function AdminInventory() {
  const {
    inventory,
    isLoading,
    error,
    updateStock,
  } = useAdminInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminInventoryItem | null>(null);
  const [newStock, setNewStock] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const columns: Column<AdminInventoryItem>[] = [
    {
      header: 'Producto',
      cell: (item) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={item.imageUrl ? getImageUrl(item.imageUrl) : '/placeholder-product.png'}
              alt={item.name}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.png';
              }}
            />
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-gray-500 text-xs">{item.sku || 'Sin SKU'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      accessorKey: 'category',
      cell: (item) => (typeof item.category === 'object' ? item.category?.name : item.category) || 'Sin Categoría',
    },
    {
      header: 'Stock Actual',
      accessorKey: 'stock',
      cell: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            item.stock > 10
              ? 'bg-green-100 text-green-800'
              : item.stock > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {item.stock}
        </span>
      ),
    },
    {
        header: 'Acciones',
        cell: (item) => (
            <button
                onClick={() => handleEditStock(item)}
                className="text-indigo-600 hover:text-indigo-900"
                title="Actualizar Stock"
            >
                <Edit className="h-5 w-5" />
            </button>
        )
    }
  ];

  const handleEditStock = (item: AdminInventoryItem) => {
    setSelectedItem(item);
    setNewStock(item.stock.toString());
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setActionError(null);
    try {
      await updateStock(selectedItem.id, parseInt(newStock));
      setIsModalOpen(false);
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
        <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <DataTable
        columns={columns}
        data={inventory}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Actualizar Stock"
      >
        {actionError && (
          <div className="mb-4">
            <Alert variant="error">{actionError}</Alert>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <p className="text-sm text-gray-500 mb-2">
                    Producto: <span className="font-medium text-gray-900">{selectedItem?.name}</span>
                </p>
            </div>
            <Input 
                label="Nuevo Stock"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                min={0}
                required
            />
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    Guardar
                </Button>
            </div>
        </form>
      </Modal>
    </div>
  );
}
