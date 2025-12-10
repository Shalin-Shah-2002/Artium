/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function safeParseUser(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored auth user', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState(() => safeParseUser(localStorage.getItem('authUser')));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }, []);

  const refreshUser = useCallback(async (tokenValue) => {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${tokenValue}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to load user');
    }

    setUser(data);
    localStorage.setItem('authUser', JSON.stringify(data));
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem('authUser');
      return;
    }

    let cancelled = false;

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to fetch user profile');
        }

        const data = await response.json();
        if (!cancelled) {
          setUser(data);
          localStorage.setItem('authUser', JSON.stringify(data));
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Auth refresh failed', err);
          logout();
        }
      }
    };

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to sign in');
      }

      setToken(data.access_token);
      localStorage.setItem('authToken', data.access_token);
      await refreshUser(data.access_token);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register');
      }

      await login(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [login]);

  const clearError = useCallback(() => setError(null), []);

  const authFetch = useCallback(async (input, init = {}) => {
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please sign in again.');
    }

    return response;
  }, [token, logout]);

  const value = {
    token,
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
