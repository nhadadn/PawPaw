import { useState, useEffect } from 'react';
import adminClient from '../api/adminClient';
import type { AdminStats } from '../types/admin';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminClient.get<AdminStats>('/api/admin/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        setError('Error al cargar estadísticas');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}
