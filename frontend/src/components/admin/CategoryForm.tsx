import { useState } from 'react';
import type { AdminCategory } from '../../types/admin';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface CategoryFormProps {
  initialData?: AdminCategory;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({ initialData, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    if (file) {
      data.append('image', file);
    }
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">{error}</div>
      )}
      <Input label="Nombre" name="name" value={formData.name} onChange={handleChange} required />

      <div className="w-full space-y-2">
        <label htmlFor="description" className="text-sm font-bold text-text-primary block">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="flex min-h-[80px] w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 bg-background-surface px-4 py-2 text-base ring-offset-background-surface placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:border-primary text-text-primary"
        />
      </div>

      <div className="w-full space-y-2">
        <label htmlFor="image" className="text-sm font-bold text-text-primary block">
          Imagen
        </label>
        <input
          id="image"
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="flex w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 bg-background-surface px-4 py-2 text-base text-text-primary file:text-text-primary file:bg-neutral-100 dark:file:bg-neutral-800 file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
