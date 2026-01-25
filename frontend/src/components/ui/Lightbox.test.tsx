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
});
