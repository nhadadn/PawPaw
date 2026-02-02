import { useState, useEffect } from 'react';
import type { AdminProduct, AdminCategory } from '../../types/admin';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getImageUrl } from '../../lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProductFormProps {
  initialData?: AdminProduct;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  categories: AdminCategory[];
}

interface ImageItem {
  type: 'existing' | 'new';
  id?: string; // For existing images
  file?: File; // For new images
  preview: string;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  categories,
}: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price.toString() || '',
    category:
      typeof initialData?.category === 'object'
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (initialData.category as any).id.toString()
        : initialData?.category || '',
    stock: initialData?.stock.toString() || '',
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData?.images && initialData.images.length > 0) {
      // eslint-disable-next-line
      setImages(
        initialData.images.map((img) => ({
          type: 'existing',
          id: img.id,
          preview: getImageUrl(img.url),
        }))
      );
    } else if (initialData?.imageUrl) {
      // Backward compatibility
      setImages([
        {
          type: 'existing',
          preview: getImageUrl(initialData.imageUrl),
        },
      ]);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setError(null);

    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      const validImages: ImageItem[] = [];

      newFiles.forEach((file) => {
        if (!file.type.startsWith('image/')) {
          setError('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('La imagen no debe superar los 5MB');
          return;
        }
        validImages.push({
          type: 'new',
          file,
          preview: URL.createObjectURL(file),
        });
      });

      setImages((prev) => [...prev, ...validImages]);

      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Solo se permiten archivos de video (MP4, WebM)');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('El video no debe superar los 50MB');
        return;
      }
      setVideoFile(file);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;

    setImages((prev) => {
      const newImages = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formDataToSend = new FormData();

    // Append basic fields
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);

    // Convert and append numeric fields
    const priceCents = Math.round(parseFloat(formData.price) * 100);
    formDataToSend.append('priceCents', priceCents.toString());

    if (formData.category) {
      formDataToSend.append('categoryId', formData.category);
    }

    if (formData.stock) {
      formDataToSend.append('initialStock', formData.stock);
    }

    // Handle images
    // 1. Append new files to FormData
    const newImages = images.filter((img) => img.type === 'new');
    newImages.forEach((img) => {
      if (img.file) {
        formDataToSend.append('images', img.file);
      }
    });

    // 3. Append video if present
    if (videoFile) {
      formDataToSend.append('video', videoFile);
    }

    // 2. Create imageOrder map
    const imageOrder = images.map((img) => {
      if (img.type === 'existing') {
        return { type: 'existing', id: img.id };
      } else {
        // Find index in the newImages array
        const newIndex = newImages.indexOf(img);
        return { type: 'new', index: newIndex };
      }
    });

    formDataToSend.append('imageOrder', JSON.stringify(imageOrder));

    console.log('Sending product FormData', { images: images.length, order: imageOrder });

    try {
      await onSubmit(formDataToSend);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error al guardar el producto');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          required
          className="flex min-h-[80px] w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 bg-background-surface px-4 py-2 text-base ring-offset-background-surface placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:border-primary text-text-primary"
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

      <div className="w-full space-y-2">
        <label htmlFor="category" className="text-sm font-bold text-text-primary block">
          Categoría
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="flex h-10 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 bg-background-surface px-4 py-2 text-sm ring-offset-background-surface placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:border-primary text-text-primary"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-bold text-text-primary mb-2">
          Imágenes
        </label>

        {/* Images List */}
        {images.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-secondary mb-2">
              Ordena las imágenes arrastrando o usando los botones:
            </p>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative w-32 h-32 group border rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-900"
                >
                  <img
                    src={img.preview}
                    alt={`Product ${index}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Controls Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-error text-white rounded-full p-1 hover:bg-error/90 transition-colors"
                        title="Eliminar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex justify-between w-full px-1">
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'left')}
                        disabled={index === 0}
                        className={`bg-background-surface text-text-primary border border-neutral-200 dark:border-neutral-800 rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Mover a la izquierda"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'right')}
                        disabled={index === images.length - 1}
                        className={`bg-background-surface text-text-primary border border-neutral-200 dark:border-neutral-800 rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${index === images.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Mover a la derecha"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-text-secondary
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20"
        />
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        <p className="text-xs text-text-secondary mt-1">
          Puedes seleccionar múltiples imágenes. Se añadirán al final.
        </p>
      </div>

      <div>
        <label htmlFor="video" className="block text-sm font-bold text-text-primary mb-2">
          Video (opcional)
        </label>
        <input
          id="video"
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          className="block w-full text-sm text-text-secondary
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20"
        />
        {videoFile && <p className="mt-2 text-xs text-text-secondary">{videoFile.name}</p>}
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
