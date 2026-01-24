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
      <div className="text-center py-20 text-neutral-500 dark:text-neutral-400">
        No se encontraron productos.
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
