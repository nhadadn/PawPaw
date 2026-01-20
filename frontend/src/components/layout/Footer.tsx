import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-white">PAW PAW</h3>
            <p className="text-sm text-neutral-400">
              Estilo urbano para la nueva generación. Ropa, accesorios y cultura en un solo lugar.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" aria-label="Facebook" className="hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">Nuevos Lanzamientos</Link></li>
              <li><Link to="/products?category=ropas" className="hover:text-white transition-colors">Ropa</Link></li>
              <li><Link to="/products?category=gorras" className="hover:text-white transition-colors">Gorras</Link></li>
              <li><Link to="/products?category=jerseys" className="hover:text-white transition-colors">Jerseys</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-white mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Envíos y Devoluciones</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-white mb-4">Newsletter</h4>
            <p className="text-sm text-neutral-400 mb-4">
              Suscríbete para recibir ofertas exclusivas y drops limitados.
            </p>
            <form className="flex gap-2">
              <Input 
                aria-label="Correo electrónico"
                placeholder="tu@email.com" 
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              />
              <Button size="icon" variant="primary" aria-label="Suscribirse">
                <Mail className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} Paw Paw Urban Show. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
