import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ZoomImage({ src, alt, className }: ZoomImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile Zoom State
  const [mobileScale, setMobileScale] = useState(1);

  // Side Zoom calculation
  const [sideZoomStyles, setSideZoomStyles] = useState<{
    left: number;
    top: number;
    display: string;
  }>({ left: 0, top: 0, display: 'none' });

  // Desktop Hover Zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const left = rect.right + 20;
      const top = Math.max(rect.top, 0);
      const display = rect.right + 520 > window.innerWidth ? 'none' : 'block';
      setSideZoomStyles({ left, top, display });
    }
  };
  const handleMouseLeave = () => setIsZoomed(false);

  // Mobile Tap
  const handleMobileClick = () => {
    // Simple check for mobile/touch device or just screen width
    if (window.innerWidth < 1024) {
      setIsMobileOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
    setMobileScale(1);
    document.body.style.overflow = 'unset';
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      {/* Desktop Container */}
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden cursor-zoom-in lg:cursor-crosshair', className)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMobileClick}
      >
        <img ref={imageRef} src={src} alt={alt} className="w-full h-full object-cover" />

        {/* Desktop Zoom Lens/Overlay */}
        {isZoomed && window.innerWidth >= 1024 && (
          <div
            className="absolute inset-0 pointer-events-none hidden lg:block z-20 bg-no-repeat"
            style={{
              backgroundImage: `url(${src})`,
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundSize: '200%',
              // Optional: show a magnifying glass effect instead of full overlay
              // But requirements say "Mostrar área de zoom ampliada 2x" and "Zoom sigue movimiento del mouse"
              // A common pattern is a separate box or an overlay.
              // "Aparece área de zoom a la derecha" -> This suggests a side-by-side zoom for Case 1.
              // BUT "Zoom sigue movimiento del mouse" in same bullet point usually implies lens or inner zoom.
              // Let's re-read: "Aparece área de zoom a la derecha"
              // OK, side-by-side zoom is requested for ProductDetail.
            }}
          />
        )}
      </div>

      {/* Side-by-side Zoom Portal for Desktop (Case 1 specific) */}
      {isZoomed &&
        window.innerWidth >= 1024 &&
        createPortal(
          <div
            className="fixed z-50 overflow-hidden bg-white border border-gray-200 shadow-xl rounded-lg pointer-events-none"
            style={{
              // This needs to be positioned relative to the image or fixed on screen.
              // If "Aparece área de zoom a la derecha", it's usually outside the image container.
              // To implement this generically without knowing parent layout is hard.
              // However, often "inner zoom" is acceptable if side-by-side is too complex to position.
              // But the requirements are specific: "Aparece área de zoom a la derecha".
              // I'll try to position it to the right of the cursor or the image.
              // Let's stick to a simpler "Inner Zoom" or "Lens Zoom" if "Side Zoom" is too brittle.
              // WAIT: "Aparece área de zoom a la derecha" -> Specifically asks for it.
              // I need to find the position of the image and place the zoom box to the right.
              left: sideZoomStyles.left,
              top: sideZoomStyles.top,
              width: 500, // Fixed width for zoom window
              height: 500, // Fixed height
              display: sideZoomStyles.display,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${src})`,
                backgroundPosition: `${position.x}% ${position.y}%`,
                backgroundSize: '200%',
              }}
            />
          </div>,
          document.body
        )}

      {/* Mobile Modal */}
      {isMobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-fade-in touch-none">
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-50"
              aria-label="Cerrar zoom"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden">
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${mobileScale})` }}
              />
            </div>

            <div className="absolute bottom-8 flex gap-4 z-50">
              <button
                onClick={() => setMobileScale((s) => Math.max(1, s - 0.5))}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-6 h-6" />
              </button>
              <span className="flex items-center text-white font-mono">
                {Math.round(mobileScale * 100)}%
              </span>
              <button
                onClick={() => setMobileScale((s) => Math.min(3, s + 0.5))}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-6 h-6" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
