'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, LOGOUT_EVENT, tokens } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean; // true until we know whether a stored session is valid
  login: (username: string, password: string) => Promise<void>;
  register: (body: { username: string; email: string; password: string; password2: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokens.access && !tokens.refresh) { setLoading(false); return; }
      try {
        const me = await api.me(); // refreshes the access token transparently if needed
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // The API client fires this when a refresh token is rejected (expired, blacklisted).
  // Other tabs also receive it through the `storage` event when tokens are removed.
  useEffect(() => {
    const onLogout = () => setUser(null);
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'snipp.access' && event.newValue === null) setUser(null);
    };
    window.addEventListener(LOGOUT_EVENT, onLogout);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LOGOUT_EVENT, onLogout);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const finish = useCallback((res: AuthResponse) => {
    tokens.set(res.access, res.refresh);
    setUser(res.user);
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    login: async (username, password) => finish(await api.login({ username, password })),
    register: async (body) => finish(await api.register(body)),
    loginWithGoogle: async (idToken) => finish(await api.google(idToken)),
    logout: async () => {
      const refresh = tokens.refresh;
      tokens.clear();
      setUser(null);
      if (refresh) { try { await api.logout(refresh); } catch { /* token expires on its own */ } }
      router.replace('/login');
    },
    setUser,
  }), [user, loading, finish, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
