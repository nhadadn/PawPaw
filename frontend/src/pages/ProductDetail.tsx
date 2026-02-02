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
      <div className="flex items-center text-sm text-text-secondary mb-8 font-medium">
        <Link to="/" className="hover:text-text-primary transition-colors">
          Inicio
        </Link>
        <span className="mx-2 text-neutral-300 dark:text-neutral-600">/</span>
        <Link to="/products" className="hover:text-text-primary transition-colors">
          Catálogo
        </Link>
        <span className="mx-3 text-neutral-300">/</span>
        <span className="font-bold text-text-primary line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Media */}
        <div className="space-y-6">
          {product.videoUrl && (
            <video controls className="w-full rounded-lg bg-black" preload="metadata">
              <source src={getImageUrl(product.videoUrl)} type="video/mp4" />
            </video>
          )}
          <ProductGallery images={images} />
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div>
            <Badge
              variant="secondary"
              className="mb-4 uppercase tracking-wider text-xs font-bold px-3 py-1"
            >
              {product.category}
            </Badge>
            <h1 className="text-3xl font-display font-black tracking-tight text-text-primary mb-4 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-accent-500">
                {formatCurrency(product.price)}
              </span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-text-secondary">4.8 (120 reviews)</span>
              </div>
            </div>
          </div>

          <p className="text-lg text-text-secondary leading-relaxed font-light">
            {product.description ||
              'Este es un producto exclusivo de la colección Paw Paw Urban. Diseñado para ofrecer estilo y comodidad sin compromisos. Fabricado con materiales de alta calidad para asegurar durabilidad y un look impecable.'}
          </p>

          {/* Selectors */}
          <div className="space-y-8">
            {showSizes && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-text-primary uppercase tracking-wide">
                    Selecciona Talla
                  </label>
                  <button
                    type="button"
                    className="text-xs text-text-secondary hover:text-text-primary underline"
                  >
                    Guía de tallas
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-accent dark:bg-accent dark:text-on-light shadow-lg transform scale-105'
                          : 'border-neutral-200 dark:border-neutral-700 text-text-secondary hover:border-neutral-900 dark:hover:border-accent dark:hover:text-accent'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Cantidad
              </label>
              <div className="flex items-center gap-6">
                <div className="flex items-center border-2 border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-lg text-text-primary">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-text-secondary font-medium">
                  {product.stock} unidades disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              size="xl"
              variant="primary"
              className="flex-1 h-16 text-lg font-bold shadow-xl shadow-accent/20 uppercase tracking-wide"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="w-6 h-6 mr-3" />
              Agregar al Carrito
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="px-6 h-16 border-2 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800 hover:border-accent hover:text-accent transition-colors"
            >
              <Star className="w-6 h-6" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
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
