import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Footer() {
  return (
    <footer className="bg-black text-neutral-400 pt-20 pb-10 border-t border-neutral-900 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="text-3xl font-display font-black tracking-tighter text-neutral-50">
              PAW PAW
            </h3>
            <p className="text-sm leading-relaxed max-w-xs">
              Estilo urbano para la nueva generación. Ropa, accesorios y cultura en un solo lugar.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                aria-label="Instagram"
                className="text-neutral-50 hover:text-accent transition-colors hover:scale-110 transform duration-200"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-neutral-50 hover:text-accent transition-colors hover:scale-110 transform duration-200"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="text-neutral-50 hover:text-accent transition-colors hover:scale-110 transform duration-200"
              >
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-neutral-50 mb-6 uppercase tracking-wider text-sm">
              Explorar
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link to="/products" className="hover:text-accent transition-colors block w-fit">
                  Nuevos Lanzamientos
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=ropas"
                  className="hover:text-accent transition-colors block w-fit"
                >
                  Ropa
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=gorras"
                  className="hover:text-accent transition-colors block w-fit"
                >
                  Gorras
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=jerseys"
                  className="hover:text-accent transition-colors block w-fit"
                >
                  Jerseys
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-neutral-50 dark:text-neutral-900 mb-6 uppercase tracking-wider text-sm">
              Ayuda
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link to="/faq" className="hover:text-accent transition-colors block w-fit">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-accent transition-colors block w-fit">
                  Envíos y Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent transition-colors block w-fit">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors block w-fit">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-neutral-50 mb-6 uppercase tracking-wider text-sm">
              Newsletter
            </h4>
            <p className="text-sm leading-relaxed mb-6">
              Suscríbete para recibir ofertas exclusivas y drops limitados.
            </p>
            <form className="flex gap-2">
              <Input
                aria-label="Correo electrónico"
                placeholder="TU@EMAIL.COM"
                className="bg-neutral-900 border-neutral-800 text-neutral-50 placeholder:text-neutral-500 focus:border-accent focus:ring-accent/20 h-11"
              />
              <Button
                size="icon"
                className="bg-white text-black hover:bg-neutral-200 h-11 w-11"
                aria-label="Suscribirse"
              >
                <Mail className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-8 text-center text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} Paw Paw Urban Show. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
