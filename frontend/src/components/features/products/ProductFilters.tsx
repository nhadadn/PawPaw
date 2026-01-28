import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface ProductFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  priceRange: { min: number; max: number };
  onPriceChange: (min: number, max: number) => void;
  onClear: () => void;
  categories?: { id: string; name: string; slug: string }[];
}

export function ProductFilters({
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  onClear,
  categories = [],
}: ProductFiltersProps) {
  return (
    <div className="space-y-8">
      {/* Categories */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-text-primary dark:text-white uppercase tracking-tight">
          Categorías
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
              selectedCategory === null
                ? 'bg-black text-white font-bold dark:bg-white dark:text-black shadow-md transform scale-[1.02]'
                : 'text-text-secondary dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-black text-white font-bold dark:bg-white dark:text-black shadow-md transform scale-[1.02]'
                  : 'text-text-secondary dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-text-primary dark:text-white uppercase tracking-tight">
          Precio
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            className="w-full h-11"
            value={priceRange.min || ''}
            onChange={(e) => onPriceChange(Number(e.target.value), priceRange.max)}
          />
          <span className="text-text-secondary dark:text-white font-medium">-</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-full h-11"
            value={priceRange.max || ''}
            onChange={(e) => onPriceChange(priceRange.min, Number(e.target.value))}
          />
        </div>
      </div>

      {/* Actions */}
      <Button
        variant="outline"
        className="w-full border-neutral-200 hover:border-red-600 hover:text-red-600 hover:bg-red-50 dark:border-neutral-800 dark:hover:bg-red-900/10 dark:hover:text-red-500 h-11 font-bold tracking-wide uppercase text-xs"
        onClick={onClear}
      >
        Limpiar Filtros
      </Button>
    </div>
  );
}
