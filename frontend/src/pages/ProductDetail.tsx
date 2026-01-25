import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Star, Truck, RotateCcw } from 'lucide-react';
import { useProductDetail } from '../hooks/useProducts';
import { useCartStore } from '../stores/cartStore';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { ProductGallery } from '../components/features/products/ProductGallery';
import { formatCurrency, getImageUrl } from '../lib/utils';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProductDetail(id || '');
  const { addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Derive available sizes from variants
  const variants = product?.variants || [];
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const showSizes = sizes.length > 0;

  // Prepare images
  const images =
    product?.images && product.images.length > 0
      ? [...product.images]
          .sort((a, b) => a.order - b.order)
          .map((img) => ({ ...img, url: getImageUrl(img.url) }))
      : product?.imageUrl
        ? [{ id: 'main', url: getImageUrl(product.imageUrl), order: 0 }]
        : [];

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  if (error || !product)
    return (
      <div className="container py-20">
        <Alert variant="error" title="Error">
          Producto no encontrado
        </Alert>
      </div>
    );

  const handleAddToCart = () => {
    // Find selected variant
    let selectedVariant;

    if (showSizes) {
      if (!selectedSize) {
        alert('Por favor selecciona una talla');
        return;
      }
      // Simple logic: find first variant with this size.
      // Ideally we would also handle colors, but for now assuming size uniqueness per product or just picking first.
      selectedVariant = variants.find((v) => v.size === selectedSize);
    } else {
      // If no sizes/variants logic (shouldn't happen with current seed), fallback to first variant if exists
      selectedVariant = variants[0];
    }

    if (!selectedVariant) {
      alert('Lo sentimos, esta variante no está disponible.');
      return;
    }

    addItem({
      id: selectedVariant.id, // Use Variant ID!
      name: `${product.name} ${selectedVariant.size ? `(${selectedVariant.size})` : ''}`, // Append size to name for clarity in cart
      price: product.price,
      image: images[0]?.url || '', // Use main image
      quantity: quantity,
      stock: selectedVariant.stock,
    });

    // Optional: Show toast or feedback
    navigate('/cart');
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        <Link to="/" className="hover:text-primary">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-primary">
          Productos
        </Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-neutral-800 dark:text-white line-clamp-1">
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <ProductGallery images={images} />

        {/* Info */}
        <div className="space-y-8">
          <div>
            <Badge variant="secondary" className="mb-2 dark:bg-neutral-800 dark:text-neutral-200">
              {product.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  4.8 (120 reviews)
                </span>
              </div>
            </div>
          </div>

          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {product.description ||
              'Este es un producto exclusivo de la colección Paw Paw Urban. Diseñado para ofrecer estilo y comodidad sin compromisos. Fabricado con materiales de alta calidad para asegurar durabilidad y un look impecable.'}
          </p>

          {/* Selectors */}
          <div className="space-y-6">
            {showSizes && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-900 dark:text-white">
                  Selecciona Talla
                </label>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold border-2 transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary text-white'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-900 dark:text-white">Cantidad</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {product.stock} disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button size="xl" className="flex-1" onClick={handleAddToCart}>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Agregar al Carrito
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="px-6 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
            >
              <Star className="w-5 h-5" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span>Envío gratis &gt; $999</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              <span>Devoluciones gratis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
