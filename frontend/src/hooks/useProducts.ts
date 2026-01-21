import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Product } from '../types/product';

export const useProducts = (params?: { category?: string }) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/api/products', { params });
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

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ id: string; name: string; slug: string }[]>('/api/categories');
      return data;
    },
  });
};
