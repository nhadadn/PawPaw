import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export function Header() {
  const navigate = useNavigate();
  const { totalItems } = useCartStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-display font-bold text-primary shrink-0">
          PAW PAW
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
          <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
          <Link to="/products" className="hover:text-primary transition-colors">Productos</Link>
          <Link to="/about" className="hover:text-primary transition-colors">Nosotros</Link>
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <form onSubmit={handleSearch} className="w-full relative">
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="w-full pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Cart */}
          <Link to="/cart" className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <ShoppingCart className="w-6 h-6 text-neutral-700" />
            {totalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {totalItems()}
              </span>
            )}
          </Link>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user?.name || 'Perfil'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate('/login')}>
                Iniciar Sesión
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-neutral-700" onClick={toggleMenu}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white p-4 space-y-4 animate-slide-down absolute w-full shadow-lg">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-neutral-400" />
            </button>
          </form>
          
          <nav className="flex flex-col gap-4 text-lg font-medium">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
            <Link to="/products" onClick={() => setIsMenuOpen(false)}>Productos</Link>
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex justify-between">
              Carrito
              <Badge variant="secondary">{totalItems()} items</Badge>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left text-error">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="w-full">
                Iniciar Sesión
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
