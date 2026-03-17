'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  authHeaders: () => Record<string, string>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// ─── JWT util ─────────────────────────────────────────────────────────────────

function msUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 - Date.now();
  } catch { return 0; }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Access token lives ONLY in memory — never touches any browser storage
  const [user, setUser]               = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── schedule silent refresh 60 s before the access token expires ────────
  const scheduleRefresh = useCallback((at: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = msUntilExpiry(at) - 60_000;
    timerRef.current = setTimeout(() => doSilentRefresh(), delay > 0 ? delay : 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── silent refresh — hits /api/auth/refresh, cookie sent automatically ──
  const doSilentRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // sends the httpOnly cookie automatically
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleRefresh(data.accessToken);
        return true;
      }
      // Cookie invalid / expired — clear state
      setUser(null);
      setAccessToken(null);
      return false;
    } catch { return false; }
  }, [scheduleRefresh]);

  // ─── on mount: restore session via /api/auth/me (cookie-authenticated) ───
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
          scheduleRefresh(data.accessToken);
        }
      } catch { /* network error — stay logged out */ }
      finally { setLoading(false); }
    })();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // server will set httpOnly cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleRefresh(data.accessToken);
        return { success: true, message: 'Login successful', user: data.user as User };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch { return { success: false, message: 'Network error occurred' }; }
  }, [scheduleRefresh]);

  // ─── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const at = accessToken;
    setUser(null);
    setAccessToken(null);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // sends httpOnly cookie so server can invalidate it
        headers: at ? { Authorization: `Bearer ${at}` } : {},
      });
    } catch { /* best-effort */ }
  }, [accessToken]);

  const refreshToken = useCallback(() => doSilentRefresh(), [doSilentRefresh]);

  const authHeaders = useCallback(
    (): Record<string, string> => accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    [accessToken]
  );

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, accessToken, authHeaders, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
