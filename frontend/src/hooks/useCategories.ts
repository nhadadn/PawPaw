import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<Category[]>('/api/categories');
      return data;
    },
  });
};
