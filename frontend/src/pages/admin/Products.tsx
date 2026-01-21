import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ProductForm } from '../../components/admin/ProductForm';
import type { AdminProduct } from '../../types/admin';
import { formatCurrency, getImageUrl } from '../../lib/utils';
import { Alert } from '../../components/ui/Alert';

export function AdminProducts() {
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useAdminProducts();

  const { categories } = useAdminCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const columns: Column<AdminProduct>[] = [
    {
      header: 'Producto',
      cell: (product) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={getImageUrl(product.imageUrl) || 'https://placehold.co/40'}
              alt={product.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/40';
              }}
            />
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-gray-500 text-xs truncate max-w-[200px]">
              {product.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Categoría',
      cell: (product) => {
        const cat = product.category as any;
        return typeof cat === 'object' ? cat?.name : cat;
      },
    },
    {
      header: 'Precio',
      cell: (product) => formatCurrency(product.price),
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      cell: (product) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            product.stock > 10
              ? 'bg-green-100 text-green-800'
              : product.stock > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {product.stock}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingProduct(undefined);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (product: AdminProduct) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProduct(product.id);
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(err.message);
        } else {
          alert('Error al eliminar');
        }
      }
    }
  };

  const handleSubmit = async (data: FormData) => {
    setFormError(null);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Error desconocido');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
        <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" />}>
          Nuevo Producto
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        {formError && (
          <div className="mb-4">
            <Alert variant="error">{formError}</Alert>
          </div>
        )}
        <ProductForm
          key={editingProduct?.id || 'new'}
          initialData={editingProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
