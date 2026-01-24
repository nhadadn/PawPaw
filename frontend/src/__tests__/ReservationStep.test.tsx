import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReservationStep } from '../features/checkout/ReservationStep';
import { useCartStore } from '../stores/cartStore';
import { useCheckoutStore } from '../stores/checkoutStore';
import { useCheckoutReserve, useCheckoutCreatePaymentIntent } from '../hooks/useCheckout';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';

// Mock dependencies
vi.mock('../stores/cartStore');
vi.mock('../stores/checkoutStore');
vi.mock('../hooks/useCheckout');
vi.mock('../lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/utils')>();
  return {
    ...actual,
    formatCurrency: (val: number) => `$${val / 100}`,
  };
});

describe('ReservationStep', () => {
  const mockReserve = vi.fn();
  const mockCreatePaymentIntent = vi.fn();
  const mockSetStep = vi.fn();
  const mockSetReservation = vi.fn();
  const mockSetClientSecret = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCheckoutReserve as unknown as Mock).mockReturnValue({
      mutate: mockReserve,
      isPending: false,
      error: null,
    });
    (useCheckoutCreatePaymentIntent as unknown as Mock).mockReturnValue({
      mutate: mockCreatePaymentIntent,
      isPending: false,
      error: null,
    });
    (useCheckoutStore as unknown as Mock).mockReturnValue({
      setStep: mockSetStep,
      setReservation: mockSetReservation,
      setClientSecret: mockSetClientSecret,
    });
  });

  it('renders empty cart message when items are empty', () => {
    (useCartStore as unknown as Mock).mockReturnValue({
      items: [],
      totalPrice: () => 0,
    });

    render(<ReservationStep />);
    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument();
  });

  it('renders items and allows reservation', async () => {
    (useCartStore as unknown as Mock).mockReturnValue({
      items: [
        {
          id: '123',
          name: 'Test Product',
          price: 1000,
          image: 'img.jpg',
          quantity: 2,
        },
      ],
      totalPrice: () => 2000,
    });

    render(<ReservationStep />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getAllByText('$20').length).toBeGreaterThan(0); // 2000 / 100

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Ej. Juan Pérez/i), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.change(screen.getByPlaceholderText(/juan@ejemplo.com/i), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Calle Principal 123/i), {
      target: { value: 'Calle 123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ciudad de México/i), {
      target: { value: 'CDMX' },
    });
    fireEvent.change(screen.getByPlaceholderText(/CDMX/i), { target: { value: 'Estado' } });
    fireEvent.change(screen.getByPlaceholderText(/01234/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByPlaceholderText(/55 1234 5678/i), {
      target: { value: '1234567890' },
    });

    const button = screen.getByRole('button', { name: /Continuar al Pago/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockReserve).toHaveBeenCalled();
    });
  });
});
