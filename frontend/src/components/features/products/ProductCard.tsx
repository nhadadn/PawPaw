import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '../../../types/product';
import { formatCurrency, getImageUrl } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block aspect-[4/5] overflow-hidden bg-neutral-100">
        <img
          src={getImageUrl(product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Quick Add Button - Mobile/Desktop hover */}
        <div className="absolute bottom-4 right-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
           <Button size="icon" className="rounded-full shadow-md" aria-label={`Añadir ${product.name} al carrito`}>
             <ShoppingBag className="w-4 h-4" />
           </Button>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="secondary" className="mb-2 text-xs">
              {product.category}
            </Badge>
            <Link to={`/products/${product.id}`}>
              <h3 className="font-bold text-neutral-900 line-clamp-1 hover:text-primary transition-colors">
          {product.name}
        </h3>
            </Link>
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <p className="font-bold text-lg text-orange-700">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>
    </div>
  );
}
