import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CartItem as CartItemType } from '../../../types/checkout';
import { formatCurrency, getImageUrl, cn } from '../../../lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export function CartItem({ item, onUpdateQuantity, onRemove, className }: CartItemProps) {
  return (
    <div className={cn('flex gap-6 py-6 group', className)}>
      {/* Image */}
      <Link
        to={`/products/${item.id}`}
        className="shrink-0 w-28 h-28 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
      >
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Link
            to={`/products/${item.id}`}
            className="font-bold text-lg text-neutral-900 dark:text-white hover:text-accent dark:hover:text-accent transition-colors line-clamp-2"
          >
            {item.name}
          </Link>
          <p className="text-accent font-bold text-lg">{formatCurrency(item.price)}</p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6">
          {/* Quantity Controls */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-xl h-12 overflow-hidden bg-white dark:bg-neutral-900">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="px-4 h-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center disabled:opacity-50 transition-colors"
              disabled={item.quantity <= 1}
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center text-base font-bold text-neutral-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-4 h-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(item.id)}
            className="text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:text-neutral-400 dark:hover:bg-red-900/20 transition-all p-3 rounded-xl"
            aria-label="Eliminar producto"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
