import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
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
      const { data } = await apiClient.post<Reservation>('/api/checkout/reserve', payload);
      return data;
    },
    onSuccess: (data) => {
      setReservation(data);
    },
  });
};

export const useCheckoutCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (payload: PaymentIntentPayload) => {
      const { data } = await apiClient.post<PaymentIntentResponse>(
        '/api/checkout/payment-intent',
        payload
      );
      return data;
    },
  });
};

export const useCheckoutConfirm = () => {
  const clearCheckout = useCheckoutStore((state) => state.clearCheckout);

  return useMutation({
    mutationFn: async (payload: ConfirmPayload) => {
      const { data } = await apiClient.post<Order>('/api/checkout/confirm', payload);
      return data;
    },
    onSuccess: () => {
      clearCheckout();
    },
  });
};

export const useCheckoutCancel = () => {
  return useMutation({
    mutationFn: async (reservationId: string) => {
      await apiClient.post('/api/checkout/cancel', { reservation_id: reservationId });
    },
  });
};
