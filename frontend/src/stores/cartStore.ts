import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types/checkout';

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  drawerAutoClose: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      drawerAutoClose: false,
      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === newItem.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
            isDrawerOpen: true,
            drawerAutoClose: true,
          });
        } else {
          set({
            items: [...items, newItem],
            isDrawerOpen: true,
            drawerAutoClose: true,
          });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        set({
          items: get().items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        });
      },
      clearCart: () => set({ items: [] }),
      openDrawer: () => set({ isDrawerOpen: true, drawerAutoClose: false }),
      closeDrawer: () => set({ isDrawerOpen: false, drawerAutoClose: false }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Don't persist drawer state
    }
  )
);
