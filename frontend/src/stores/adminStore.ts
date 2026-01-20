import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminState, AdminUser } from '../types/admin';

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      login: (token: string, user: AdminUser) =>
        set({ isAuthenticated: true, token, user }),
      logout: () =>
        set({ isAuthenticated: false, token: null, user: null }),
    }),
    {
      name: 'admin-storage',
    }
  )
);
