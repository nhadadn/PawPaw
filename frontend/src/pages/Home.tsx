import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Clock,
  ChevronDown,
  Star,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProductGrid } from '../components/features/products/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { getImageUrl } from '../lib/utils';
import { useState, useEffect } from 'react';

export function Home() {
  const { data: products, isLoading, error } = useProducts();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const featuredProducts = products?.slice(0, 4) || [];

  // Countdown Timer Logic (Next Drop in 24h for demo)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  return (
    <div className="space-y-0 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex flex-col justify-end md:justify-center overflow-hidden">
        {/* Background Image - Parallax & Full Width */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop"
            alt="High-impact Streetwear Collection"
            className="w-full h-full object-cover object-[center_20%] md:object-center transition-transform duration-[20s] hover:scale-110 ease-linear"
            loading="eager"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 md:to-black/60" />
          <div className="absolute inset-0 bg-neutral-900/20 mix-blend-multiply" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 w-full md:container md:mx-auto md:px-4">
          {/* Mobile: Bottom Sheet style / Desktop: Centered */}
          <div className="bg-neutral-900/80 backdrop-blur-md border-t border-white/10 p-8 md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex flex-col items-center text-center space-y-8 animate-slide-up rounded-t-[2.5rem] md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none">
            {/* Social Proof */}
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm animate-fade-in delay-100">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-neutral-400 border-2 border-neutral-900 overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span>+10,000 clientes satisfechos</span>
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
            </div>

            {/* Headlines */}
            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter text-white leading-[0.9]">
                ESTILO URBANO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary animate-pulse-scale inline-block">
                  SIN LÍMITES
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-neutral-200 max-w-2xl mx-auto font-light leading-relaxed">
                Redefine tu identidad con la colección más exclusiva de streetwear. Calidad premium
                para quienes se atreven a destacar.
              </p>
            </div>

            {/* Countdown (Optional) */}
            <div className="hidden md:flex gap-4 text-white font-mono text-sm tracking-widest uppercase">
              <div className="text-center">
                <span className="block text-2xl font-bold">{formatTime(timeLeft.hours)}</span>
                <span className="text-xs text-neutral-400">Horas</span>
              </div>
              <div className="text-2xl font-bold">:</div>
              <div className="text-center">
                <span className="block text-2xl font-bold">{formatTime(timeLeft.minutes)}</span>
                <span className="text-xs text-neutral-400">Min</span>
              </div>
              <div className="text-2xl font-bold">:</div>
              <div className="text-center">
                <span className="block text-2xl font-bold">{formatTime(timeLeft.seconds)}</span>
                <span className="text-xs text-neutral-400">Seg</span>
              </div>
              <div className="flex items-center ml-2 text-primary font-bold">
                <span className="w-2 h-2 bg-primary rounded-full animate-ping mr-2"></span>
                NEXT DROP
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 pt-4">
              <Link to="/products" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  className="w-full sm:w-auto min-w-[200px] text-lg font-bold shadow-[0_0_20px_rgba(255,107,53,0.3)] hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] transition-all duration-300 hover:scale-105 animate-pulse-scale"
                >
                  Ver Colección
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/products?category=ropas" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto min-w-[200px] text-lg text-white border-white/30 hover:bg-white hover:text-neutral-900 hover:border-white backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  Explorar Ropa
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:flex flex-col items-center text-white/50 gap-2">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 p-6 bg-neutral-50 rounded-xl border border-neutral-100">
            <div className="p-3 bg-primary/10 rounded-full text-orange-700">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Envío Rápido</h3>
              <p className="text-neutral-600 text-sm">Envíos a todo el país en 24/48h.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-neutral-50 rounded-xl border border-neutral-100">
            <div className="p-3 bg-primary/10 rounded-full text-orange-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pago Seguro</h3>
              <p className="text-neutral-600 text-sm">Transacciones encriptadas y protegidas.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-neutral-50 rounded-xl border border-neutral-100">
            <div className="p-3 bg-primary/10 rounded-full text-orange-700">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Reserva Real</h3>
              <p className="text-neutral-600 text-sm">Tu stock asegurado por 10 minutos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold">Destacados</h2>
            <p className="text-neutral-600">Lo más vendido de la semana.</p>
          </div>
          <Link to="/products">
            <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver todo
            </Button>
          </Link>
        </div>

        <ProductGrid products={featuredProducts} isLoading={isLoading} error={error} />
      </section>

      {/* Categories */}
      <section className="bg-neutral-900 py-20 text-white">
        <div className="container mx-auto px-4 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">Categorías</h2>
            <p className="text-neutral-300">Explora por tipo de producto.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingCategories ? (
              <div className="col-span-full text-center text-white">Cargando categorías...</div>
            ) : categories?.length === 0 ? (
              <div className="col-span-full text-center text-white">
                No hay categorías disponibles
              </div>
            ) : (
              categories?.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  className="group relative h-80 rounded-xl overflow-hidden"
                >
                  <img
                    src={cat.imageUrl ? getImageUrl(cat.imageUrl) : 'https://placehold.co/600x400'}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400';
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <h3 className="text-2xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {cat.name}
                    </h3>
                    <span className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-neutral-900 px-4 py-2 rounded-full text-sm font-bold">
                      Ver Productos
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4">
        <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 md:p-16 text-center space-y-6">
          <ShoppingBag className="w-12 h-12 mx-auto text-orange-700 dark:text-orange-500" />
          <h2 className="text-3xl font-display font-bold text-neutral-900 dark:text-white">
            Únete al Club Paw Paw
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 max-w-lg mx-auto">
            Recibe notificaciones sobre nuevos lanzamientos, ofertas exclusivas y eventos.
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              aria-label="Correo electrónico"
              type="email"
              placeholder="Ingresa tu correo"
              className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button size="lg">Suscribirse</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
