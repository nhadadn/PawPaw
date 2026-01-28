import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Package, Shield, Clock, ChevronDown, Star } from 'lucide-react';
import { Button, buttonVariants } from '../components/ui/Button';
import { ProductGrid } from '../components/features/products/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { getImageUrl } from '../lib/utils';
import { useState } from 'react';

export function Home() {
  const { data: products, isLoading, error } = useProducts();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const [email, setEmail] = useState('');
  const featuredProducts = products?.slice(0, 4) || [];

  // Countdown Timer Logic (Next Drop in 24h for demo)
  /*
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
  */

  return (
    <div className="space-y-0 pb-20 bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-black">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 opacity-60">
          <img
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2000&auto=format&fit=crop"
            alt="High-impact Streetwear Collection"
            className="w-full h-full object-cover object-[center_20%] animate-pulse-scale"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 container mx-auto px-4 text-center md:text-left">
          <div className="max-w-4xl space-y-8 animate-slide-up">
            {/* Social Proof */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-black overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  +10k Clientes
                </span>
                <span className="flex text-accent" role="img" aria-label="5 de 5 estrellas">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-current" aria-hidden="true" />
                  ))}
                </span>
              </div>
            </div>

            {/* Headlines */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-display font-black tracking-tighter text-white leading-[0.9]">
              ESTILO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-400 to-neutral-600">
                URBANO
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-neutral-100 max-w-2xl font-light leading-relaxed">
              Redefine tu identidad con la colección más exclusiva de streetwear. Calidad premium
              para quienes se atreven a destacar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Link
                to="/products"
                className={buttonVariants({
                  size: 'xl',
                  className:
                    'w-full sm:w-auto min-w-[200px] text-lg font-bold bg-accent hover:bg-accent-hover text-white dark:text-neutral-100 border-none shadow-lg shadow-accent/20',
                })}
              >
                Ver Colección
                <ArrowRight className="w-6 h-6 ml-2" />
              </Link>
              <Link
                to="/products?category=ropas"
                className={buttonVariants({
                  size: 'xl',
                  variant: 'outline',
                  className:
                    'w-full sm:w-auto min-w-[200px] text-lg text-white border-white/20 hover:bg-white hover:text-black dark:hover:text-black hover:border-white backdrop-blur-sm',
                })}
              >
                Explorar Ropa
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce flex flex-col items-center text-neutral-200 gap-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Scroll Down</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 -mt-20 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-8 bg-background-surface rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-text-primary">
              <Package className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2 text-text-primary">
                Envíos Globales
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Llevamos el estilo urbano a cualquier rincón del mundo.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-8 bg-background-surface rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-text-primary">
              <Shield className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2 text-text-primary">
                Compra Segura
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Tu seguridad es nuestra prioridad. Pagos 100% encriptados.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-8 bg-background-surface rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-text-primary">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl mb-2 text-text-primary">
                Soporte 24/7
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Equipo de atención al cliente listo para ayudarte siempre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-20 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight text-text-primary">
              Destacados
            </h2>
            <p className="text-lg text-text-secondary max-w-md">
              Descubre las piezas más codiciadas de nuestra colección esta semana.
            </p>
          </div>
          <Link
            to="/products"
            className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'group text-lg' })}
          >
            Ver todo el catálogo
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} isLoading={isLoading} error={error} />
      </section>

      {/* Categories */}
      <section className="bg-neutral-950 py-32 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 opacity-50" />

        <div className="container mx-auto px-4 space-y-16 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight">
              EXPLORA POR CATEGORÍA
            </h2>
            <p className="text-neutral-200 text-lg max-w-2xl mx-auto">
              Encuentra exactamente lo que buscas en nuestras colecciones curadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingCategories ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : categories?.length === 0 ? (
              <div className="col-span-full text-center text-neutral-600 dark:text-neutral-300">
                No hay categorías disponibles
              </div>
            ) : (
              categories?.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  className="group relative h-[400px] rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <img
                    src={cat.imageUrl ? getImageUrl(cat.imageUrl) : 'https://placehold.co/600x400'}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400';
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    <h3 className="text-3xl font-display font-bold mb-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                      {cat.name}
                    </h3>
                    <span className="opacity-0 group-hover:opacity-100 translate-y-8 group-hover:translate-y-0 transition-all duration-500 delay-100 bg-white text-black px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide hover:bg-neutral-200">
                      Explorar
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-black text-white rounded-[2rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
            <ShoppingBag className="w-16 h-16 mx-auto text-accent mb-4" />
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white">
              ÚNETE AL CLUB PAW PAW
            </h2>
            <p className="text-xl text-neutral-100">
              Recibe acceso anticipado a drops exclusivos, ofertas secretas y contenido curado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
              <input
                aria-label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                className="flex-1 h-14 rounded-full px-6 bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 focus:outline-none focus:border-accent focus:bg-white/20 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                size="xl"
                className="bg-accent hover:bg-accent-hover text-white font-bold px-8"
              >
                Suscribirse
              </Button>
            </div>
            <p className="text-xs text-neutral-100 mt-4">
              Al suscribirte aceptas nuestros términos y condiciones. Sin spam, prometido.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
