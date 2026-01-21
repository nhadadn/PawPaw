import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CategoryForm } from '../../components/admin/CategoryForm';
import type { AdminCategory } from '../../types/admin';
import { Alert } from '../../components/ui/Alert';
import { getImageUrl } from '../../lib/utils';

export function AdminCategories() {
  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useAdminCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const columns: Column<AdminCategory>[] = [
    {
      header: 'Nombre',
      cell: (category) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={getImageUrl(category.image) || 'https://placehold.co/40'}
              alt={category.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/40';
              }}
            />
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{category.name}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Descripción',
      accessorKey: 'description',
      cell: (category) => (
        <span className="text-gray-500 text-sm truncate max-w-[300px] block">
            {category.description || '-'}
        </span>
      )
    },
  ];

  const handleCreate = () => {
    setEditingCategory(undefined);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: AdminCategory) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await deleteCategory(category.id);
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
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
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
        <h1 className="text-2xl font-semibold text-gray-900">Categorías</h1>
        <Button onClick={handleCreate} leftIcon={<Plus className="h-4 w-4" />}>
          Nueva Categoría
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        {formError && (
          <div className="mb-4">
            <Alert variant="error">{formError}</Alert>
          </div>
        )}
        <CategoryForm
          key={editingCategory?.id || 'new'}
          initialData={editingCategory}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
