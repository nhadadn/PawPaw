import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Star, Truck, RotateCcw } from 'lucide-react';
import { useProductDetail } from '../hooks/useProducts';
import { useCartStore } from '../stores/cartStore';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProductDetail(id || '');
  const { addItem } = useCartStore();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Mock sizes for clothing/shoes categories
  const sizes = ['S', 'M', 'L', 'XL'];
  const showSizes = product?.category === 'Ropas' || product?.category === 'Jerseys';

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error || !product) return <div className="container py-20"><Alert variant="error" title="Error">Producto no encontrado</Alert></div>;

  const handleAddToCart = () => {
    if (showSizes && !selectedSize) {
      alert('Por favor selecciona una talla');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      quantity: quantity,
      // size: selectedSize // Add to CartItem type if needed
    });

    // Optional: Show toast or feedback
    navigate('/cart');
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-neutral-500 mb-8">
        <Link to="/" className="hover:text-primary">Inicio</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-primary">Productos</Link>
        <span className="mx-2">/</span>
        <span className="font-bold text-neutral-800 line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          {/* Mock thumbnails */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-neutral-100 rounded-lg overflow-hidden cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                 <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div>
            <Badge variant="secondary" className="mb-2">{product.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium text-neutral-600">4.8 (120 reviews)</span>
              </div>
            </div>
          </div>

          <p className="text-neutral-600 leading-relaxed">
            {product.description || 'Este es un producto exclusivo de la colección Paw Paw Urban. Diseñado para ofrecer estilo y comodidad sin compromisos. Fabricado con materiales de alta calidad para asegurar durabilidad y un look impecable.'}
          </p>

          {/* Selectors */}
          <div className="space-y-6">
            {showSizes && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-900">Selecciona Talla</label>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold border-2 transition-all ${
                        selectedSize === size 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-neutral-200 text-neutral-600 hover:border-primary/50'
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
              <label className="text-sm font-bold text-neutral-900">Cantidad</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-300 rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-neutral-100 text-neutral-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-neutral-100 text-neutral-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-neutral-500">{product.stock} disponibles</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-neutral-100">
            <Button size="xl" className="flex-1" onClick={handleAddToCart}>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Agregar al Carrito
            </Button>
            <Button size="xl" variant="outline" className="px-6">
              <Star className="w-5 h-5" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
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
