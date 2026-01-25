import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Reservation, Order } from '../types/checkout';

type CheckoutStep = 'reservation' | 'payment' | 'confirmation';

interface ReservationFormData {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  shippingMethod: 'standard' | 'express';
}

interface CheckoutStore {
  step: CheckoutStep;
  reservation: Reservation | null;
  clientSecret: string | null;
  confirmedOrder: Order | null;
  formData: ReservationFormData | null;
  setStep: (step: CheckoutStep) => void;
  setReservation: (reservation: Reservation) => void;
  setClientSecret: (secret: string) => void;
  setConfirmedOrder: (order: Order) => void;
  setFormData: (data: ReservationFormData) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      step: 'reservation',
      reservation: null,
      clientSecret: null,
      confirmedOrder: null,
      formData: null,
      setStep: (step) => set({ step }),
      setReservation: (reservation) => set({ reservation }),
      setClientSecret: (clientSecret) => set({ clientSecret }),
      setConfirmedOrder: (confirmedOrder) => set({ confirmedOrder }),
      setFormData: (formData) => set({ formData }),
      clearCheckout: () =>
        set({
          step: 'reservation',
          reservation: null,
          clientSecret: null,
          confirmedOrder: null,
          formData: null,
        }),
    }),
    {
      name: 'pawpaw-checkout-storage',
      partialize: (state) => ({
        step: state.step,
        reservation: state.reservation,
        clientSecret: state.clientSecret,
        confirmedOrder: state.confirmedOrder,
        formData: state.formData,
      }),
    }
  )
);
