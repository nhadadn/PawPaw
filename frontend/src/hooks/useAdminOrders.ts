import { useState, useEffect, useCallback } from 'react';
import adminClient from '../api/adminClient';
import type { AdminOrder } from '../types/admin';
import axios from 'axios';

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.get<AdminOrder[]>('/api/admin/orders');
      setOrders(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar órdenes');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrderStatus = async (id: string, status: AdminOrder['status']) => {
    setIsLoading(true);
    try {
      await adminClient.patch(`/api/admin/orders/${id}/status`, { status });
      await fetchOrders();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al actualizar estado de la orden');
      }
      throw new Error('Error al actualizar estado de la orden');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderDetails = async (id: string) => {
    try {
      const response = await adminClient.get<AdminOrder>(`/api/admin/orders/${id}`);
      return response.data;
    } catch (err: unknown) {
       if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al cargar detalles de la orden');
      }
      throw new Error('Error al cargar detalles de la orden');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    updateOrderStatus,
    getOrderDetails,
  };
}
