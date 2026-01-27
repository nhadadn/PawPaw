import { Suspense, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageSkeleton } from '../Loading';
import { CartDrawer } from '../features/cart/CartDrawer';
import { useAutoContrast } from '../../hooks/useAutoContrast';

export function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  useAutoContrast(mainRef);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <CartDrawer />
      <main ref={mainRef} className="flex-1 auto-contrast">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
