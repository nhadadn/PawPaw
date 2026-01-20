import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAdminStore } from '../stores/adminStore';
import adminClient from '../api/adminClient';
import type { AdminUser } from '../types/admin';

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAdminStore((state) => state.login);
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminClient.post<{ token: string; user: AdminUser }>(
        '/api/admin/login',
        { email, password }
      );

      const { token, user: responseUser } = response.data;
      
      // Handle case where user is not returned by backend (mocked backend behavior)
      const user: AdminUser = responseUser || {
        id: 'admin-id',
        name: 'Admin User',
        email: email,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      login(token, user);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.'
        );
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, isLoading, error };
}
