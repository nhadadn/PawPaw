import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProductGrid } from '../components/features/products/ProductGrid';
import { useProducts } from '../hooks/useProducts';

export function Home() {
  const { data: products, isLoading, error } = useProducts();
  const featuredProducts = products?.slice(0, 4) || [];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-neutral-900 text-white py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
            ESTILO URBANO <br />
            <span className="text-primary">SIN LÍMITES</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Descubre la colección más exclusiva de ropa, accesorios y tecnología para la vida moderna. 
            Calidad premium, diseño único.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/products">
              <Button size="xl" className="w-full sm:w-auto">
                Ver Colección
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/products?category=ropas">
              <Button size="xl" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-neutral-900">
                Explorar Ropa
              </Button>
            </Link>
          </div>
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
            {[
              { name: 'Ropa', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800', slug: 'ropas' },
              { name: 'Gorras', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800', slug: 'gorras' },
              { name: 'Jerseys', img: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?q=80&w=800', slug: 'jerseys' },
              { name: 'Tech', img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800', slug: 'dispositivos' },
            ].map((cat) => (
              <Link 
                key={cat.slug} 
                to={`/products?category=${cat.slug}`}
                className="group relative h-80 rounded-xl overflow-hidden"
              >
                <img 
                  src={cat.img} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-40"
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
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4">
        <div className="bg-primary/5 rounded-3xl p-8 md:p-16 text-center space-y-6">
          <ShoppingBag className="w-12 h-12 mx-auto text-orange-700" />
          <h2 className="text-3xl font-display font-bold">Únete al Club Paw Paw</h2>
          <p className="text-neutral-700 max-w-lg mx-auto">
            Recibe notificaciones sobre nuevos lanzamientos, ofertas exclusivas y eventos.
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input 
              aria-label="Correo electrónico"
              type="email" 
              placeholder="Ingresa tu correo" 
              className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button size="lg">Suscribirse</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
