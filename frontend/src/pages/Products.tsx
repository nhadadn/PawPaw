import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { useProducts, useCategories } from '../hooks/useProducts';
import { ProductGrid } from '../components/features/products/ProductGrid';
import { ProductFilters } from '../components/features/products/ProductFilters';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const { data: products, isLoading, error } = useProducts({ 
    category: categoryParam || undefined 
  });
  
  const { data: categories } = useCategories();

  const searchParam = searchParams.get('search');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync state with URL params if they change
  useEffect(() => {
    console.log('[Products Page] URL category param changed:', categoryParam);
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (categories) {
      console.log('[Products Page] Loaded categories:', categories);
    }
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    console.log('[Products Page] Filtering products:', {
       total: products.length,
       categoryParam,
       selectedCategory,
       priceRange,
       searchParam
    });

    return products
      .filter((p) => {
        // Category Filter - Handled by Backend
        // if (selectedCategory && p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        
        // Price Filter
        if (p.price < priceRange.min * 100 || (priceRange.max > 0 && p.price > priceRange.max * 100)) return false;

        // Search Filter
        if (searchParam && !p.name.toLowerCase().includes(searchParam.toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'newest':
            return 0; // Assuming no date field for now, or use ID
          default:
            return 0;
        }
      });
  }, [products, selectedCategory, priceRange, searchParam, sortBy, categoryParam]);

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    if (cat) {
        setSearchParams({ category: cat });
    } else {
        setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: 0, max: 100000 });
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-neutral-500 mb-8">
        <Link to="/" className="hover:text-primary">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-neutral-800">Productos</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filters Trigger */}
        <div className="lg:hidden flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-display">Catálogo</h1>
            <Button variant="outline" size="sm" onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}>
                <Filter className="w-4 h-4 mr-2" />
                Filtros
            </Button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`lg:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24">
            <ProductFilters
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceChange={(min, max) => setPriceRange({ min, max })}
              onClear={clearFilters}
              categories={categories}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50 p-4 rounded-lg">
            <p className="text-sm text-neutral-500">
              Mostrando <span className="font-bold text-neutral-900">{filteredProducts.length}</span> productos
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-600">Ordenar por:</span>
              <select 
                className="text-sm border-none bg-transparent font-bold focus:ring-0 cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Menor Precio</option>
                <option value="price-desc">Mayor Precio</option>
                <option value="newest">Más Nuevos</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <ProductGrid products={filteredProducts} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
