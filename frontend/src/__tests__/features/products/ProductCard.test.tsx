import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '../../../components/features/products/ProductCard';
import { BrowserRouter } from 'react-router-dom';
import type { Product } from '../../../types/product';

// Mock formatCurrency to avoid locale issues
vi.mock('../../../lib/utils', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/utils')>('../../../lib/utils');
  return {
    ...actual,
    formatCurrency: (amount: number) => `$${amount}`,
  };
});

// Mock store
const mockAddItem = vi.fn();
vi.mock('../../../stores/cartStore', () => ({
  useCartStore: <T,>(selector: (state: { addItem: typeof mockAddItem }) => T) => {
    const state = { addItem: mockAddItem };
    return selector(state);
  },
}));

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 100,
  imageUrl: 'test-image.jpg',
  category: 'test-category',
  stock: 10,
  variants: [
    { id: 'v1', productId: '1', size: 'M', color: 'Red', sku: '123', price: 100, stock: 5 },
    { id: 'v2', productId: '1', size: 'L', color: 'Red', sku: '124', price: 100, stock: 5 },
  ],
  isNew: true,
  discount: 10,
  averageRating: 4.5,
  totalReviews: 10,
  availableSizes: ['M', 'L'],
};

describe('ProductCard', () => {
  it('renders product details correctly', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    // Price with discount: 100 - 10% = 90
    expect(screen.getByText('$90')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument(); // Original price
  });

  it('calls onAddToCart when button is clicked', () => {
    const handleAddToCart = vi.fn();
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} onAddToCart={handleAddToCart} />
      </BrowserRouter>
    );

    const addButton = screen.getByText('Añadir');
    fireEvent.click(addButton);

    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct, undefined);
  });

  it('calls onWishlist when heart icon is clicked', () => {
    const handleWishlist = vi.fn();
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} onWishlist={handleWishlist} />
      </BrowserRouter>
    );

    const wishlistBtn = screen.getByLabelText('Añadir a lista de deseos');
    fireEvent.click(wishlistBtn);
    expect(handleWishlist).toHaveBeenCalledWith(mockProduct);
  });
});
