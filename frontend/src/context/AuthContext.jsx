import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, setAuthToken } from '../services/api.js';

const AuthContext = createContext();

const STORAGE_KEY = 'crm-auth';

/**
 * Provides authentication state (token + user) to the React tree.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.token) {
          setToken(saved.token);
          setUser(saved.user);
          setAuthToken(saved.token);
        }
      } catch (error) {
        console.warn('Falha ao restaurar sessão', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    setToken(data.token);
    setUser(data.user);
    setAuthToken(data.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ token, user, loading, login, logout, isAuthenticated: Boolean(token) }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return context;
}
