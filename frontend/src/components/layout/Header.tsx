import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../providers/ThemeProvider';
import { Button, buttonVariants } from '../ui/Button';
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
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black text-neutral-50 dark:text-neutral-900 transition-colors duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-3xl font-display font-black tracking-tighter text-neutral-50 dark:text-neutral-900 shrink-0 hover:scale-105 transition-transform"
        >
          PAW PAW
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-8 text-sm font-medium"
        >
          <Link
            to="/"
            className="text-white hover:text-neutral-300 dark:hover:text-neutral-400 transition-colors tracking-wide uppercase"
          >
            Inicio
          </Link>
          <Link
            to="/products"
            className="text-white hover:text-neutral-300 dark:hover:text-neutral-400 transition-colors tracking-wide uppercase"
          >
            Productos
          </Link>
          <Link
            to="/about"
            className="text-white hover:text-neutral-300 dark:hover:text-neutral-400 transition-colors tracking-wide uppercase"
          >
            Nosotros
          </Link>
        </nav>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <form onSubmit={handleSearch} className="w-full relative group">
            <Input
              type="search"
              aria-label="Buscar productos"
              placeholder="BUSCAR..."
              className="w-full h-11 pl-4 pr-12 bg-neutral-900/50 border-neutral-800 text-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 placeholder:text-neutral-500 focus:border-accent focus:ring-accent/20 rounded-full transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-accent transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 hover:bg-neutral-900 rounded-full transition-colors text-neutral-50 hover:text-accent"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          {/* Cart */}
          <button
            onClick={openDrawer}
            aria-label={`Carrito de compras con ${totalItems()} artículos`}
            className="relative p-3 hover:bg-neutral-900 rounded-full transition-colors group"
          >
            <ShoppingCart className="w-6 h-6 text-neutral-50 dark:text-neutral-50 group-hover:text-accent transition-colors" />
            {totalItems() > 0 && (
              <span className="absolute top-0 right-0 bg-accent text-neutral-50 dark:text-neutral-900 text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black">
                {totalItems()}
              </span>
            )}
          </button>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className:
                      'gap-2 text-neutral-50 dark:text-neutral-900 hover:text-accent hover:bg-neutral-900 dark:hover:bg-neutral-200 font-medium',
                  })}
                >
                  <User className="w-5 h-5" />
                  <span className="max-w-[100px] truncate">{user?.name || 'Perfil'}</span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className={buttonVariants({
                  size: 'sm',
                  className: 'bg-white text-black hover:bg-neutral-200 font-bold px-6',
                })}
              >
                LOGIN
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 text-white hover:text-accent transition-colors"
            onClick={toggleMenu}
            aria-label="Menú principal"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-transform duration-300 ease-in-out md:hidden flex flex-col pt-24 px-6 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handleSearch} className="relative mb-8">
          <Input
            type="search"
            aria-label="Buscar productos"
            placeholder="BUSCAR PRODUCTOS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 text-lg bg-neutral-900 border-neutral-800 text-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 placeholder:text-neutral-600 dark:placeholder:text-neutral-500 focus:border-accent"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2"
          >
            <Search className="w-6 h-6 text-neutral-400" />
          </button>
        </form>

        <nav className="flex flex-col gap-2">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-between p-4 text-2xl font-bold text-neutral-50 dark:text-neutral-900 hover:text-accent border-b border-neutral-900 transition-colors"
          >
            INICIO
            <span className="text-neutral-800">→</span>
          </Link>
          <Link
            to="/products"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-between p-4 text-2xl font-bold text-neutral-50 dark:text-neutral-900 hover:text-accent border-b border-neutral-900 transition-colors"
          >
            PRODUCTOS
            <span className="text-neutral-800">→</span>
          </Link>
          <Link
            to="/cart"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-between p-4 text-2xl font-bold text-neutral-50 dark:text-neutral-900 hover:text-accent border-b border-neutral-900 transition-colors"
          >
            CARRITO
            <Badge variant="destructive" className="ml-2 text-lg px-3 py-1">
              {totalItems()}
            </Badge>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-4 text-2xl font-bold text-white hover:text-accent border-b border-neutral-900 transition-colors"
              >
                MI PERFIL
                <User className="w-6 h-6" />
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-between w-full p-4 text-2xl font-bold text-red-500 hover:text-red-400 border-b border-neutral-900 transition-colors text-left"
              >
                CERRAR SESIÓN
                <LogOut className="w-6 h-6" />
              </button>
            </>
          ) : (
            <div className="mt-8 grid gap-4">
              <Button
                size="lg"
                onClick={() => {
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-neutral-200"
              >
                INICIAR SESIÓN
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  navigate('/register');
                  setIsMenuOpen(false);
                }}
                className="w-full h-14 text-lg font-bold border-neutral-800 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-900"
              >
                REGISTRARSE
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
