import { useState } from 'react';
import type { AdminProduct } from '../../types/admin';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ProductFormProps {
  initialData?: AdminProduct;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price.toString() || '',
    category: initialData?.category || '',
    stock: initialData?.stock.toString() || '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    if (file) {
      data.append('image', file);
    }
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <div className="w-full space-y-2">
        <label className="text-sm font-bold text-neutral-700 block">
            Descripción
        </label>
        <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="flex min-h-[80px] w-full rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-base ring-offset-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
            label="Precio"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
        />
        <Input
            label="Stock"
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            required
        />
      </div>

      <Input
        label="Categoría"
        name="category"
        value={formData.category}
        onChange={handleChange}
        required
      />
      
      <div>
        <label className="block text-sm font-bold text-neutral-700 mb-2">Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
