import { render, screen } from '@testing-library/react';
import { ConfirmationStep } from '../features/checkout/ConfirmationStep';
import { useCheckoutStore } from '../stores/checkoutStore';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../stores/checkoutStore');

// Mock formatCurrency to behave like real app (input is main units)
vi.mock('../lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/utils')>();
  return {
    ...actual,
    formatCurrency: (val: number) => `$${val.toFixed(2)}`,
    formatDate: () => 'Date',
  };
});

describe('ConfirmationStep', () => {
  const mockClearCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCheckoutStore as unknown as Mock).mockReturnValue({
      clearCheckout: mockClearCheckout,
    });
  });

  const mockOrder = {
    id: '1',
    order_number: 'ORD-1',
    status: 'paid' as const,
    total_amount: 10, // 10 pesos
    items: [
      {
        id: '1',
        product_variant_id: '1',
        quantity: 2,
        price: 500, // 500 cents = 5 pesos
        name: 'Test Product',
      },
    ],
    created_at: new Date().toISOString(),
  };

  it('renders order details correctly', () => {
    render(
      <BrowserRouter>
        <ConfirmationStep order={mockOrder} />
      </BrowserRouter>
    );

    expect(screen.getByText('#ORD-1')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();

    // Item calculation: ((500 * 2) / 100).toFixed(2) = "10.00"
    // Rendered as $10.00
    // Total calculation: formatCurrency(10) -> $10.00

    const prices = screen.getAllByText('$10.00');
    expect(prices.length).toBeGreaterThanOrEqual(2);
  });

  it('renders gracefully when items are missing (robustness check)', () => {
    const safeOrder = {
      ...mockOrder,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: undefined as any, // Simulate missing items from legacy backend
    };

    render(
      <BrowserRouter>
        <ConfirmationStep order={safeOrder} />
      </BrowserRouter>
    );

    expect(screen.getByText('#ORD-1')).toBeInTheDocument();
    // Should not crash
  });
});
