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
  categories = []
}: ProductFiltersProps) {
  return (
    <div className="space-y-8">
      {/* Categories */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Categorías</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange(null)}
            className={`block w-full text-left text-sm ${
              selectedCategory === null ? 'font-bold text-primary' : 'text-neutral-600'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`block w-full text-left text-sm ${
                selectedCategory === cat.slug ? 'font-bold text-primary' : 'text-neutral-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Precio</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            className="w-full"
            value={priceRange.min || ''}
            onChange={(e) => onPriceChange(Number(e.target.value), priceRange.max)}
          />
          <span className="text-neutral-400">-</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-full"
            value={priceRange.max || ''}
            onChange={(e) => onPriceChange(priceRange.min, Number(e.target.value))}
          />
        </div>
      </div>

      {/* Actions */}
      <Button variant="outline" className="w-full" onClick={onClear}>
        Limpiar Filtros
      </Button>
    </div>
  );
}
