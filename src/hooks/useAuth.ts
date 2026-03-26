import { useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vibe_token'));

  useEffect(() => {
    const stored = localStorage.getItem('vibe_token');
    if (stored) {
      fetchMe(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string) {
    try {
      const data = await api.auth.me(t);
      if (data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const data = await api.auth.login({ username, password });
    if (data.token) {
      localStorage.setItem('vibe_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Ошибка входа' };
  }

  async function register(username: string, display_name: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const data = await api.auth.register({ username, display_name, password });
    if (data.token) {
      localStorage.setItem('vibe_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Ошибка регистрации' };
  }

  function logout() {
    localStorage.removeItem('vibe_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }

  return { user, loading, token, login, register, logout, setUser };
}