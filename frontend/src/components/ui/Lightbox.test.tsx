import { render, screen, fireEvent } from '@testing-library/react';
import { Lightbox } from './Lightbox';
import { describe, it, expect, vi } from 'vitest';

describe('Lightbox', () => {
  const images = [
    { url: 'img1.jpg', alt: 'Image 1' },
    { url: 'img2.jpg', alt: 'Image 2' },
  ];
  const onClose = vi.fn();

  it('does not render when closed', () => {
    render(<Lightbox isOpen={false} onClose={onClose} images={images} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<Lightbox isOpen={true} onClose={onClose} images={images} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
  });

  it('navigates between images', () => {
    render(<Lightbox isOpen={true} onClose={onClose} images={images} />);

    const nextBtn = screen.getByLabelText('Siguiente imagen');
    fireEvent.click(nextBtn);

    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
  });

  it('closes on close button click', () => {
    render(<Lightbox isOpen={true} onClose={onClose} images={images} />);

    const closeBtn = screen.getByLabelText('Cerrar galería');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('navigates with keyboard arrows', () => {
    render(<Lightbox isOpen={true} onClose={() => {}} images={images} />);

    // Right arrow -> Next image
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();

    // Left arrow -> Previous image (Image 2 -> Image 1)
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    const onCloseSpy = vi.fn();
    render(<Lightbox isOpen={true} onClose={onCloseSpy} images={images} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('supports swipe gestures', () => {
    render(<Lightbox isOpen={true} onClose={() => {}} images={images} />);

    // The main container has onTouchStart and onTouchEnd.
    // It's the div with className "relative w-full h-full..." inside the dialog portal.
    // Wait, the dialog portal is the outer div.
    // The inner div (Main Image Container) has the handlers.
    // Let's find it by some characteristic or just querySelector.
    // The dialog has role="dialog". It contains a div with onTouchStart.
    // Actually, looking at Lightbox.tsx:
    // <div ... role="dialog"> ... <div ... onTouchStart={...}> ... </div> </div>

    const touchContainer = screen.getByAltText('Image 1').closest('div')?.parentElement;

    if (touchContainer) {
      // Swipe Left (Next)
      fireEvent.touchStart(touchContainer, { touches: [{ clientX: 300 }] });
      fireEvent.touchEnd(touchContainer, { changedTouches: [{ clientX: 200 }] }); // Diff = 100 > 50
      expect(screen.getByAltText('Image 2')).toBeInTheDocument();

      // Swipe Right (Prev)
      fireEvent.touchStart(touchContainer, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(touchContainer, { changedTouches: [{ clientX: 300 }] }); // Diff = -100 < -50
      expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    }
  });
});
