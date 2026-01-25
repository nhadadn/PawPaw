import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ZoomImage } from '../../ui/ZoomImage';

interface ProductGalleryProps {
  images: { id: string; url: string; alt?: string }[];
  className?: string;
}

export function ProductGallery({ images, className }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();

    setTouchStart(null);
  };

  // Auto-scroll thumbnails
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeThumb = thumbnailsRef.current.children[selectedIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  if (!images || images.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image Area */}
      <div
        className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <ZoomImage
          key={selectedIndex} // Force re-mount for animation if needed, or better use transition
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt || 'Product image'}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Navigation Arrows (Desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-neutral-800 dark:text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots (Mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 lg:hidden pointer-events-none">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-2 h-2 rounded-full transition-all shadow-sm',
                  selectedIndex === idx ? 'bg-white scale-125' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div ref={thumbnailsRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                'relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all snap-start',
                selectedIndex === idx
                  ? 'border-black dark:border-white opacity-100 shadow-md scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-neutral-300 dark:hover:border-neutral-600'
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover dark:brightness-90" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
