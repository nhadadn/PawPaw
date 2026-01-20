import { useState, useEffect, useCallback } from 'react';
import adminClient from '../api/adminClient';
import type { AdminInventoryItem } from '../types/admin';
import axios from 'axios';

export function useAdminInventory() {
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this might be a separate endpoint or just products endpoint
      // Mapping products to inventory items for now as they are essentially the same in this schema
      const response = await adminClient.get<AdminInventoryItem[]>('/api/admin/products');
      setInventory(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar inventario');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStock = async (id: string, stock: number) => {
    setIsLoading(true);
    try {
      await adminClient.patch(`/api/admin/products/${id}/stock`, { stock });
      await fetchInventory();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al actualizar stock');
      }
      throw new Error('Error al actualizar stock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    inventory,
    isLoading,
    error,
    fetchInventory,
    updateStock,
  };
}
