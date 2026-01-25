import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGallery } from './ProductGallery';
import { describe, it, expect } from 'vitest';

describe('ProductGallery', () => {
  const images = [
    { id: '1', url: 'img1.jpg', alt: 'Image 1' },
    { id: '2', url: 'img2.jpg', alt: 'Image 2' },
  ];

  it('renders main image and thumbnails', () => {
    render(<ProductGallery images={images} />);

    // Main image
    expect(screen.getByAltText('Image 1')).toBeInTheDocument();

    // Thumbnails
    const thumbnails = screen.getAllByRole('button');
    // 2 thumbnails + 2 navigation arrows (if visible)
    // The navigation arrows have aria-label "Previous image" and "Next image"
    // Thumbnails don't have aria-label in my impl, but contain img.
    // Let's count total buttons.
    // Wait, thumbnails are buttons.
    expect(thumbnails.length).toBeGreaterThanOrEqual(2);
  });

  it('changes image on thumbnail click', () => {
    render(<ProductGallery images={images} />);

    // Find all buttons
    // We expect: Prev Arrow, Next Arrow (since >1 images), Thumb 1, Thumb 2.
    // However, arrows might be hidden or appear in different order in DOM.
    // Thumbnails are in a separate div.

    // Let's find buttons that contain images.
    // Or simpler: verify we have buttons.
    const allButtons = screen.getAllByRole('button');

    // Filter buttons that are thumbnails (they contain an image and no aria-label for nav)
    // Actually my implementation: arrows have aria-label "Previous image" / "Next image".
    const thumbButtons = allButtons.filter((btn) => !btn.getAttribute('aria-label'));

    expect(thumbButtons.length).toBe(2);

    // Click the second thumbnail
    fireEvent.click(thumbButtons[1]);

    // Verify the main image has changed.
    // The main image is the one displayed in ZoomImage.
    // It should now match the second image url.

    // We can find the main image by its alt text.
    // The component updates the alt text when image changes.
    // Initial alt: "Image 1". New alt: "Image 2".
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
  });
});
