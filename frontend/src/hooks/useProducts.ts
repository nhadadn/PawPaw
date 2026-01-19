import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Product } from '../types/product';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/api/products');
      return data;
    },
  });
};

export const useProductDetail = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Product>(`/api/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
};
