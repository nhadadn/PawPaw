import type { Product } from '../../../types/product';
import { ProductCard } from './ProductCard';
import { Alert } from '../../ui/Alert';
import { Spinner } from '../../ui/Spinner';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ProductGrid({ products, isLoading, error }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Error al cargar productos">
        {error.message || 'Inténtalo de nuevo más tarde.'}
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-neutral-600 dark:text-neutral-300 max-w-md">
          Intenta ajustar tus filtros o búsqueda para encontrar lo que buscas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
