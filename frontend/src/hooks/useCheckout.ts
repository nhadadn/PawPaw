import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Reservation, Order, ReservationItem } from '../types/checkout';
import { useCheckoutStore } from '../stores/checkoutStore';

interface ReservePayload {
  items: ReservationItem[];
}

interface ConfirmPayload {
  reservation_id: string;
  payment_intent_id: string;
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
