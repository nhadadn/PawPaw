import { useEffect } from 'react';
import { applyAutoContrast } from '../lib/contrast';

export function useAutoContrast(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    applyAutoContrast(el);
    const observer = new MutationObserver(() => applyAutoContrast(el));
    observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'], subtree: false });
    const resize = () => applyAutoContrast(el);
    window.addEventListener('resize', resize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [ref]);
}
