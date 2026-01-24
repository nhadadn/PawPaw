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
    <div className={cn('flex gap-4 py-6', className)}>
      {/* Image */}
      <Link
        to={`/products/${item.id}`}
        className="shrink-0 w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden"
      >
        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <Link
            to={`/products/${item.id}`}
            className="font-bold text-neutral-900 dark:text-white hover:text-primary transition-colors line-clamp-2"
          >
            {item.name}
          </Link>
          <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
          {/* Mock Size display if we had it in store */}
          {/* <p className="text-xs text-neutral-500 dark:text-neutral-400">Talla: M</p> */}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6">
          {/* Quantity Controls */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg h-10">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="px-3 h-full hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center disabled:opacity-50"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-10 text-center text-sm font-bold text-neutral-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-3 h-full hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(item.id)}
            className="text-neutral-400 hover:text-error transition-colors p-2"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
