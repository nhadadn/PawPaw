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

  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    category: categoryParam || undefined,
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
      searchParam,
    });

    return products
      .filter((p) => {
        // Category Filter - Handled by Backend
        // if (selectedCategory && p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;

        // Price Filter
        if (
          p.price < priceRange.min * 100 ||
          (priceRange.max > 0 && p.price > priceRange.max * 100)
        )
          return false;

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
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-neutral-500 mb-8 font-medium">
        <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">
          Inicio
        </Link>
        <span className="mx-3 text-neutral-300">/</span>
        <span className="font-bold text-neutral-900 dark:text-white">Productos</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Mobile Filters Trigger */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-black tracking-tight text-neutral-900 dark:text-white">
            Catálogo
          </h1>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="bg-black text-white dark:bg-white dark:text-black font-bold"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Sidebar Filters */}
        <aside
          className={`lg:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}
        >
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
        <div className="flex-1 space-y-8">
          {/* Header & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#141414] p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Mostrando{' '}
              <span className="font-bold text-neutral-900 dark:text-white">
                {filteredProducts.length}
              </span>{' '}
              productos
            </p>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                Ordenar por:
              </span>
              <select
                className="text-sm border-none bg-transparent font-bold focus:ring-0 cursor-pointer text-neutral-900 dark:text-white pr-8 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option
                  value="relevance"
                  className="dark:bg-neutral-900 text-black dark:text-white"
                >
                  Relevancia
                </option>
                <option
                  value="price-asc"
                  className="dark:bg-neutral-900 text-black dark:text-white"
                >
                  Menor Precio
                </option>
                <option
                  value="price-desc"
                  className="dark:bg-neutral-900 text-black dark:text-white"
                >
                  Mayor Precio
                </option>
                <option value="newest" className="dark:bg-neutral-900 text-black dark:text-white">
                  Más Nuevos
                </option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {!isLoading && filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Button
                className="h-14 px-8 text-lg font-bold bg-white dark:bg-black text-black dark:text-white border-2 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all rounded-xl"
                variant="outline"
                size="xl"
                onClick={clearFilters}
              >
                Ver todos los productos
              </Button>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} isLoading={isLoading} error={error} />
          )}
        </div>
      </div>
    </div>
  );
}
