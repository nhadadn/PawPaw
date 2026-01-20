import { useState, useEffect, useCallback } from 'react';
import adminClient from '../api/adminClient';
import type { AdminProduct } from '../types/admin';
import axios from 'axios';

export function useAdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.get<AdminProduct[]>('/api/admin/products');
      setProducts(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar productos');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = async (productData: FormData | Partial<AdminProduct>) => {
    setIsLoading(true);
    try {
      // Check if it's FormData (for file uploads) or JSON
      const config = productData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
      
      await adminClient.post('/api/admin/products', productData, config);
      await fetchProducts();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al crear producto');
      }
      throw new Error('Error al crear producto');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: FormData | Partial<AdminProduct>) => {
    setIsLoading(true);
    try {
       const config = productData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      await adminClient.put(`/api/admin/products/${id}`, productData, config);
      await fetchProducts();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al actualizar producto');
      }
      throw new Error('Error al actualizar producto');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setIsLoading(true);
    try {
      await adminClient.delete(`/api/admin/products/${id}`);
      await fetchProducts();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
         throw new Error(err.response?.data?.message || 'Error al eliminar producto');
      }
      throw new Error('Error al eliminar producto');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
