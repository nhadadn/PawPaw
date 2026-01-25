import { renderHook, waitFor } from '@testing-library/react';
import { useValidateReservation } from '../../../hooks/useCheckout';
import { useCheckoutStore } from '../../../stores/checkoutStore';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '../../../api/client';

// Mock dependencies
vi.mock('../../../stores/checkoutStore');

// Mock API client
vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

describe('Checkout Persistence Logic (useValidateReservation)', () => {
  const mockClearCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mock
    (useCheckoutStore as unknown as Mock).mockImplementation((selector) => {
      // Mock state for selector
      const state = {
        clearCheckout: mockClearCheckout,
      };

      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
  });

  it('clears checkout when reservation is expired', async () => {
    // Mock expired reservation response
    (apiClient.get as Mock).mockResolvedValue({
      data: { status: 'expired' },
    });

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useValidateReservation('res_123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isExpired).toBe(true);
      expect(mockClearCheckout).toHaveBeenCalled();
    });
  });

  it('clears checkout when getReservation returns error', async () => {
    // Mock error response
    (apiClient.get as Mock).mockRejectedValue(new Error('Failed to fetch'));

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useValidateReservation('res_123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isExpired).toBe(true);
      expect(mockClearCheckout).toHaveBeenCalled();
    });
  });

  it('does NOT clear checkout when reservation is active', async () => {
    // Mock active reservation response
    (apiClient.get as Mock).mockResolvedValue({
      data: { status: 'active' },
    });

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useValidateReservation('res_123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isExpired).toBe(false);
    expect(mockClearCheckout).not.toHaveBeenCalled();
  });
});
