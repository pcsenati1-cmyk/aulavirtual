import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export function useSessionCheck() {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = async () => {
      try {
        await api.get('/auth/me');
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          window.location.href = '/login';
        }
      }
    };

    check(); // verificar inmediatamente
    const interval = setInterval(check, 30000); // cada 30 segundos
    return () => clearInterval(interval);
  }, [isAuthenticated]);
}
