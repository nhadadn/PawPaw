import { create } from 'zustand';
import type { Reservation } from '../types/checkout';

interface CheckoutStore {
  reservation: Reservation | null;
  clientSecret: string | null;
  setReservation: (reservation: Reservation) => void;
  setClientSecret: (secret: string) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  reservation: null,
  clientSecret: null,
  setReservation: (reservation) => set({ reservation }),
  setClientSecret: (clientSecret) => set({ clientSecret }),
  clearCheckout: () => set({ reservation: null, clientSecret: null }),
}));
