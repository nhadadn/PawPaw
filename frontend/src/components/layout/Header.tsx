import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../providers/ThemeProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export function Header() {
  const navigate = useNavigate();
  const { totalItems, openDrawer } = useCartStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();
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
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 dark:border-neutral-800 bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-display font-bold text-primary shrink-0">
          PAW PAW
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <Link to="/" className="hover:text-primary transition-colors">
            Inicio
          </Link>
          <Link to="/products" className="hover:text-primary transition-colors">
            Productos
          </Link>
          <Link to="/about" className="hover:text-primary transition-colors">
            Nosotros
          </Link>
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <form onSubmit={handleSearch} className="w-full relative">
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="w-full pr-10 bg-neutral-100 dark:bg-neutral-800 border-transparent focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-primary"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-700 dark:text-neutral-200"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Cart */}
          <button
            onClick={openDrawer}
            aria-label="Abrir carrito de compras"
            className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-neutral-700 dark:text-neutral-200" />
            {totalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {totalItems()}
              </span>
            )}
          </button>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
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
          <button
            className="md:hidden p-2 text-neutral-700 dark:text-neutral-200"
            onClick={toggleMenu}
            aria-label="Menú principal"
          >
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
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              Inicio
            </Link>
            <Link to="/products" onClick={() => setIsMenuOpen(false)}>
              Productos
            </Link>
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex justify-between">
              Carrito
              <Badge variant="secondary">{totalItems()} items</Badge>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  Mi Perfil
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-left text-error"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Button
                onClick={() => {
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="w-full"
              >
                Iniciar Sesión
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
