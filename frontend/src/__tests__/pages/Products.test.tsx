import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Products } from '../../pages/Products';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../hooks/useProducts', () => ({
  useProducts: () => ({
    data: [{ id: '1', name: 'Gorra Test', price: 1000, category: 'Gorras' }],
    isLoading: false,
    error: null,
  }),
  useCategories: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe('Products Page', () => {
  it('renders background image when category is "Gorras"', () => {
    // Set URL parameter
    window.history.pushState({}, 'Test Page', '/products?category=gorras');

    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    // Check for the image
    const img = screen.getByAltText('Gorras Background');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('unsplash.com'));
  });

  it('does not render background image when category is not "Gorras"', () => {
    // Set URL parameter
    window.history.pushState({}, 'Test Page', '/products?category=ropas');

    render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );

    // Check that image is NOT present
    const img = screen.queryByAltText('Gorras Background');
    expect(img).not.toBeInTheDocument();
  });
});
