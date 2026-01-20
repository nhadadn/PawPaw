import { useState, useEffect, useCallback } from 'react';
import adminClient from '../api/adminClient';
import type { AdminUser } from '../types/admin';
import axios from 'axios';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.get<AdminUser[]>('/api/admin/users');
      setUsers(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al cargar usuarios');
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserRole = async (id: string, role: AdminUser['role']) => {
    setIsLoading(true);
    try {
      await adminClient.patch(`/api/admin/users/${id}/role`, { role });
      await fetchUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al actualizar rol de usuario');
      }
      throw new Error('Error al actualizar rol de usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (id: string, status: AdminUser['status']) => {
    setIsLoading(true);
    try {
      await adminClient.patch(`/api/admin/users/${id}/status`, { status });
      await fetchUsers();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || 'Error al actualizar estado de usuario');
      }
      throw new Error('Error al actualizar estado de usuario');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    updateUserRole,
    updateUserStatus,
  };
}
