import { useState, useEffect, useCallback } from 'react';
import adminClient from '../api/adminClient';
import type { AdminCategory } from '../types/admin';
import axios from 'axios';

export function useAdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.get<AdminCategory[]>('/api/admin/categories');
      setCategories(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar categorías');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = async (categoryData: FormData | Partial<AdminCategory>) => {
    setIsLoading(true);
    try {
      const config = categoryData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      
      await adminClient.post('/api/admin/categories', categoryData, config);
      await fetchCategories();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al crear categoría');
      }
      throw new Error('Error al crear categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, categoryData: FormData | Partial<AdminCategory>) => {
    setIsLoading(true);
    try {
      const config = categoryData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      await adminClient.put(`/api/admin/categories/${id}`, categoryData, config);
      await fetchCategories();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al actualizar categoría');
      }
      throw new Error('Error al actualizar categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setIsLoading(true);
    try {
      await adminClient.delete(`/api/admin/categories/${id}`);
      await fetchCategories();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
         throw new Error(err.response?.data?.message || 'Error al eliminar categoría');
      }
      throw new Error('Error al eliminar categoría');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
