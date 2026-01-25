import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReservationStep } from '../features/checkout/ReservationStep';
import { useCartStore } from '../stores/cartStore';
import { useCheckoutStore } from '../stores/checkoutStore';
import {
  useCheckoutReserve,
  useCheckoutCreatePaymentIntent,
  useGetReservation,
} from '../hooks/useCheckout';
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
  const mockSetFormData = vi.fn();
  const mockClearCheckout = vi.fn();

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
    (useGetReservation as unknown as Mock).mockReturnValue({
      data: null,
      error: null,
    });
    (useCheckoutStore as unknown as Mock).mockReturnValue({
      setStep: mockSetStep,
      setReservation: mockSetReservation,
      setClientSecret: mockSetClientSecret,
      setFormData: mockSetFormData,
      clearCheckout: mockClearCheckout,
      reservation: null,
      formData: null,
    });
  });

  it('renders empty cart message when items are empty', () => {
    (useCartStore as unknown as Mock).mockReturnValue({
      items: [],
      totalPrice: () => 0,
    });

    render(<ReservationStep />);
    expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('renders items and allows reservation', async () => {
    (useCartStore as unknown as Mock).mockReturnValue({
      items: [{ id: '1', name: 'Product 1', price: 1000, quantity: 2, image: 'img1.jpg' }],
      totalPrice: () => 2000,
    });

    render(<ReservationStep />);

    // Check summary
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    const prices = screen.getAllByText('$20');
    expect(prices.length).toBeGreaterThan(0); // 2000 cents / 100

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Ej. Juan Pérez/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/juan@ejemplo.com/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Calle Principal/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ciudad de México/i), {
      target: { value: 'Mexico City' },
    });
    fireEvent.change(screen.getByPlaceholderText(/CDMX/i), { target: { value: 'CDMX' } });
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
