import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGallery } from './ProductGallery';
import { describe, it, expect } from 'vitest';

describe('ProductGallery', () => {
  const images = [
    { id: '1', url: 'img1.jpg', alt: 'Image 1' },
    { id: '2', url: 'img2.jpg', alt: 'Image 2' },
    { id: '3', url: 'img3.jpg', alt: 'Image 3' },
  ];

  it('renders main image and thumbnails', () => {
    render(<ProductGallery images={images} />);

    // Main image
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();

    // Thumbnails
    const allButtons = screen.getAllByRole('button');
    // Filter out nav arrows
    const thumbButtons = allButtons.filter((btn) => !btn.getAttribute('aria-label'));
    expect(thumbButtons.length).toBe(3);
  });

  it('changes image on thumbnail click', () => {
    render(<ProductGallery images={images} />);

    const allButtons = screen.getAllByRole('button');
    const thumbButtons = allButtons.filter((btn) => !btn.getAttribute('aria-label'));

    // Click 2nd thumbnail
    fireEvent.click(thumbButtons[1]);
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
  });

  it('navigates with arrows', () => {
    render(<ProductGallery images={images} />);

    const nextBtn = screen.getByLabelText('Next image');
    fireEvent.click(nextBtn);
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();

    const prevBtn = screen.getByLabelText('Previous image');
    fireEvent.click(prevBtn);
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
  });

  it('supports swipe gestures', () => {
    render(<ProductGallery images={images} />);

    // The touch handlers are on the main image container.
    // We need to find the element that has the handlers.
    // It's the parent of the ZoomImage (which renders an img).
    const mainImage = screen.getByAltText('Image 1');
    const container = mainImage.closest('div')?.parentElement;
    // Wait, ZoomImage renders an img inside a div?
    // ZoomImage: <div ...><img ...>...</div>
    // ProductGallery: <div ... onTouch...><ZoomImage ...>...</div>
    // So mainImage.parentElement is ZoomImage div.
    // mainImage.parentElement.parentElement is ProductGallery main div.

    if (container) {
      // Swipe Left (Next)
      fireEvent.touchStart(container, { touches: [{ clientX: 300 }] });
      fireEvent.touchEnd(container, { changedTouches: [{ clientX: 200 }] }); // Diff = 100 > 50
      expect(screen.getByAltText('Image 2')).toBeInTheDocument();

      // Swipe Right (Prev)
      fireEvent.touchStart(container, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(container, { changedTouches: [{ clientX: 300 }] }); // Diff = -100 < -50
      expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    }
  });
});
