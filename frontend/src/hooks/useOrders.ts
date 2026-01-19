import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Order } from '../types/checkout';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await apiClient.get<Order[]>('/api/orders');
      return data;
    },
  });
};
