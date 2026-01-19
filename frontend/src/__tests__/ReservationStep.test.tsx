import { render, screen, fireEvent } from '@testing-library/react';
import { ReservationStep } from '../features/checkout/ReservationStep';
import { useCartStore } from '../stores/cartStore';
import { useCheckoutReserve } from '../hooks/useCheckout';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';

// Mock dependencies
vi.mock('../stores/cartStore');
vi.mock('../hooks/useCheckout');
vi.mock('../lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/utils')>();
  return {
    ...actual,
    formatCurrency: (val: number) => `$${val / 100}`,
  };
});

describe('ReservationStep', () => {
  const mockOnSuccess = vi.fn();
  const mockReserve = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCheckoutReserve as unknown as Mock).mockReturnValue({
      mutate: mockReserve,
      isPending: false,
      error: null,
    });
  });

  it('renders empty cart message when items are empty', () => {
    (useCartStore as unknown as Mock).mockReturnValue({
      items: [],
      totalPrice: () => 0,
    });

    render(<ReservationStep onSuccess={mockOnSuccess} />);
    expect(screen.getByText(/Carrito vacío/i)).toBeInTheDocument();
  });

  it('renders items and allows reservation', () => {
    (useCartStore as unknown as Mock).mockReturnValue({
      items: [
        {
          productVariantId: '123',
          quantity: 2,
          product: { name: 'Test Product', price: 1000, imageUrl: 'img.jpg' },
          variant: { color: 'Red', size: 'M' },
        },
      ],
      totalPrice: () => 2000,
    });

    render(<ReservationStep onSuccess={mockOnSuccess} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$20')).toBeInTheDocument(); // 2000 / 100

    const button = screen.getByRole('button', { name: /Reservar Stock/i });
    fireEvent.click(button);

    expect(mockReserve).toHaveBeenCalled();
  });
});
