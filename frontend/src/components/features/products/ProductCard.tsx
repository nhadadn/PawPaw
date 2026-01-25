import { memo, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Star, Images } from 'lucide-react';
import type { Product } from '../../../types/product';
import { formatCurrency, getImageUrl, cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useCartStore } from '../../../stores/cartStore';
import { Lightbox } from '../../ui/Lightbox';

export interface ProductCardProps {
  product: Product;
  className?: string;
  onAddToCart?: (product: Product, size?: string) => void;
  onQuickView?: (product: Product) => void;
  onWishlist?: (product: Product) => void;
  showWishlist?: boolean;
  showQuickView?: boolean;
  showGallery?: boolean;
}

interface ExtendedProduct extends Product {
  availableSizes?: string[];
  discount?: number;
  isNew?: boolean;
  averageRating?: number;
  totalReviews?: number;
}

const ProductCardComponent = ({
  product: originalProduct,
  className,
  onAddToCart,
  onQuickView,
  onWishlist,
  showWishlist = true,
  showQuickView = true,
  showGallery = true,
}: ProductCardProps) => {
  const product = originalProduct as ExtendedProduct;
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [isWishlistActive, setIsWishlistActive] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // Derived state
  const sizes = useMemo(() => {
    // Check if product has availableSizes property
    if (product.availableSizes && product.availableSizes.length > 0) {
      return product.availableSizes;
    }
    return Array.from(new Set(product.variants?.map((v) => v.size) || [])).sort();
  }, [product]);

  const discountPrice = useMemo(() => {
    // Check if product has discount property
    if (product.discount && product.discount > 0) {
      return product.price * (1 - product.discount / 100);
    }
    return null;
  }, [product]);

  const galleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return [...product.images]
        .sort((a, b) => a.order - b.order)
        .map((img) => ({ url: getImageUrl(img.url), alt: product.name }));
    }
    return [{ url: getImageUrl(product.imageUrl), alt: product.name }];
  }, [product]);

  const displayPrice = discountPrice || product.price;
  const hasDiscount = !!discountPrice;

  // Handlers
  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onAddToCart) {
        onAddToCart(product, selectedSize);
      } else {
        // Default behavior
        const variant = selectedSize
          ? product.variants.find((v) => v.size === selectedSize)
          : product.variants[0];

        addItem({
          id: variant?.id || product.id, // Fallback if no variant found
          name: product.name,
          price: product.price,
          image: product.imageUrl,
          quantity: 1,
        });
      }
    },
    [onAddToCart, product, selectedSize, addItem]
  );

  const handleQuickView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onQuickView) onQuickView(product);
    },
    [onQuickView, product]
  );

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsWishlistActive((prev) => !prev);
      if (onWishlist) onWishlist(product);
    },
    [onWishlist, product]
  );

  const handleGalleryOpen = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(true);
  }, []);

  const handleSizeSelect = useCallback((e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  }, []);

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden',
          className
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded-sm">
          {/* Badges */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
            {product.isNew && (
              <Badge
                variant="secondary"
                className="uppercase text-[10px] tracking-wider px-2 py-1 font-bold shadow-sm"
              >
                Nuevo
              </Badge>
            )}
            {hasDiscount && (
              <Badge
                variant="destructive"
                className="uppercase text-[10px] tracking-wider px-2 py-1 font-bold shadow-sm"
              >
                -{product.discount}%
              </Badge>
            )}
          </div>

          {/* Action Buttons (Wishlist / QuickView / Gallery) */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-2 transition-opacity duration-300 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
            {showWishlist && (
              <button
                onClick={handleWishlist}
                className={cn(
                  'p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95',
                  isWishlistActive
                    ? 'text-red-500'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-red-500'
                )}
                aria-label="Añadir a lista de deseos"
              >
                <Heart className={cn('w-4 h-4', isWishlistActive && 'fill-current')} />
              </button>
            )}
            {showQuickView && (
              <button
                onClick={handleQuickView}
                className="p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-sm backdrop-blur-sm text-neutral-600 dark:text-neutral-300 transition-transform hover:scale-110 active:scale-95 hover:text-primary"
                aria-label="Vista rápida"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {showGallery && galleryImages.length > 0 && (
              <button
                onClick={handleGalleryOpen}
                className="p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-sm backdrop-blur-sm text-neutral-600 dark:text-neutral-300 transition-transform hover:scale-110 active:scale-95 hover:text-primary"
                aria-label="Ver galería"
              >
                <Images className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Main Image */}
          <Link to={`/products/${product.id}`} className="block w-full h-full">
            <img
              src={getImageUrl(product.imageUrl)}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x600?text=No+Image';
              }}
            />
          </Link>

          {/* Desktop CTA (Hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 ease-in-out lg:group-hover:translate-y-0 hidden lg:block">
            <Button
              onClick={handleAddToCart}
              className="w-full shadow-lg font-medium tracking-wide uppercase text-xs"
              size="sm"
            >
              {selectedSize ? 'Añadir al carrito' : 'Seleccionar opciones'}
            </Button>
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col flex-grow pt-3 pb-2 px-1 space-y-2">
          {/* Name */}
          <Link
            to={`/products/${product.id}`}
            className="group-hover:text-primary transition-colors"
          >
            <h3 className="font-display font-medium text-neutral-900 dark:text-white text-base leading-tight line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Price & Rating Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-bold text-sm',
                  hasDiscount
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-900 dark:text-white'
                )}
              >
                {formatCurrency(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3 h-3',
                      (product.averageRating || 4.5) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700'
                    )}
                  />
                ))}
              </div>
              {product.totalReviews && (
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  ({product.totalReviews})
                </span>
              )}
            </div>
          </div>

          {/* Sizes - Always visible on mobile, or managed via state */}
          {sizes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {sizes.slice(0, 5).map((size: string) => (
                <button
                  key={size}
                  onClick={(e) => handleSizeSelect(e, size)}
                  className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-[10px] border transition-all',
                    selectedSize === size
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400'
                  )}
                >
                  {size}
                </button>
              ))}
              {sizes.length > 5 && (
                <span className="text-[10px] text-neutral-400 self-center">+</span>
              )}
            </div>
          )}

          {/* Mobile CTA (Always visible) */}
          <div className="mt-auto pt-2 lg:hidden">
            <Button
              onClick={handleAddToCart}
              className="w-full text-xs py-2 h-auto"
              variant="outline"
              size="sm"
            >
              Añadir
            </Button>
          </div>
        </div>
      </div>

      <Lightbox
        key={isLightboxOpen ? 'open' : 'closed'}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={galleryImages}
      />
    </>
  );
};

export const ProductCard = memo(ProductCardComponent);
