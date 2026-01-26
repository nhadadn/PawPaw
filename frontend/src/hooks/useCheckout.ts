import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { AxiosError } from 'axios';
import type { Reservation, Order, ReservationItem } from '../types/checkout';
import { useCheckoutStore } from '../stores/checkoutStore';

interface ReservePayload {
  items: ReservationItem[];
}

interface PaymentIntentPayload {
  reservation_id: string;
}

interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

interface ConfirmPayload {
  reservation_id: string;
  payment_intent_id: string;
  email?: string;
}

export const useCheckoutReserve = () => {
  const setReservation = useCheckoutStore((state) => state.setReservation);

  return useMutation({
    mutationFn: async (payload: ReservePayload) => {
      try {
        const { data } = await apiClient.post<Reservation>('/api/checkout/reserve', payload);
        return data;
      } catch (error: unknown) {
        if (error instanceof AxiosError && error.response && error.response.status === 409) {
          // You might want to throw a specific error or handle it in UI
          throw new Error(
            error.response.data.message ||
              'Conflicto de reserva: Stock insuficiente o reserva existente.'
          );
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      setReservation(data);
    },
  });
};

/**
 * Hook to fetch and validate a reservation by ID.
 * Used for recovering session state and checking expiration.
 * @param id - The reservation ID to fetch
 */
export const useGetReservation = (id: string | null) => {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get<Reservation>(`/api/checkout/reservations/${id}`);
      return data;
    },
    enabled: !!id,
    retry: false, // Don't retry if it fails (likely expired/not found)
  });
};

/**
 * Hook to validate reservation status and handle expiration.
 * Clears checkout store if reservation is expired or not found.
 */
export const useValidateReservation = (id: string | null) => {
  const clearCheckout = useCheckoutStore((state) => state.clearCheckout);
  const [isExpired, setIsExpired] = useState(false);

  const query = useGetReservation(id);

  useEffect(() => {
    if (id) {
      if (query.error || (query.data && query.data.status === 'expired')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsExpired(true);
        clearCheckout();
      }
    }
  }, [id, query.error, query.data, clearCheckout]);

  return { ...query, isExpired };
};

export const useCheckoutCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (payload: PaymentIntentPayload) => {
      const { data } = await apiClient.post<PaymentIntentResponse>(
        '/api/checkout/create-payment-intent',
        payload
      );
      return data;
    },
  });
};

export const useCheckoutConfirm = () => {
  // const clearCheckout = useCheckoutStore((state) => state.clearCheckout);

  return useMutation({
    mutationFn: async (payload: ConfirmPayload) => {
      const { data } = await apiClient.post<Order>('/api/checkout/confirm', payload);
      return data;
    },
    // Don't clear checkout here, as we need the confirmedOrder state for the confirmation step.
    // Cleanup should happen when leaving the confirmation page or starting a new flow.
    /* onSuccess: () => {
      clearCheckout();
    }, */
  });
};

export const useCheckoutCancel = () => {
  return useMutation({
    mutationFn: async (reservationId: string) => {
      await apiClient.post('/api/checkout/cancel', { reservation_id: reservationId });
    },
  });
};
