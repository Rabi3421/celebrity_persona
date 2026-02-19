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

// ─── localStorage helpers ─────────────────────────────────────────────────────

const KEY = { AT: 'cp_access_token', RT: 'cp_refresh_token', USER: 'cp_user' };

function saveSession(at: string, rt: string, user: User) {
  try {
    localStorage.setItem(KEY.AT, at);
    localStorage.setItem(KEY.RT, rt);
    localStorage.setItem(KEY.USER, JSON.stringify(user));
  } catch { /* SSR guard */ }
}

function clearSession() {
  try { Object.values(KEY).forEach((k) => localStorage.removeItem(k)); } catch { /* guard */ }
}

function loadSession() {
  try {
    const at = localStorage.getItem(KEY.AT);
    const rt = localStorage.getItem(KEY.RT);
    const raw = localStorage.getItem(KEY.USER);
    const user: User | null = raw ? JSON.parse(raw) : null;
    return { at, rt, user };
  } catch {
    return { at: null, rt: null, user: null };
  }
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
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const rtRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((at: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = msUntilExpiry(at) - 60_000; // 60 s before expiry
    timerRef.current = setTimeout(() => doSilentRefresh(), delay > 0 ? delay : 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSilentRefresh = useCallback(async (): Promise<boolean> => {
    const rt = rtRef.current;
    if (!rt) { clearSession(); setUser(null); setAccessToken(null); return false; }
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
        try {
          localStorage.setItem(KEY.AT, data.accessToken);
          localStorage.setItem(KEY.USER, JSON.stringify(data.user));
        } catch { /* guard */ }
        scheduleRefresh(data.accessToken);
        return true;
      }
      clearSession(); setUser(null); setAccessToken(null); rtRef.current = null;
      return false;
    } catch { return false; }
  }, [scheduleRefresh]);

  useEffect(() => {
    const { at, rt, user: savedUser } = loadSession();
    if (at && rt && savedUser) {
      if (msUntilExpiry(at) > 0) {
        setAccessToken(at); setUser(savedUser); rtRef.current = rt;
        scheduleRefresh(at); setLoading(false);
      } else {
        rtRef.current = rt;
        doSilentRefresh().finally(() => setLoading(false));
      }
    } else { setLoading(false); }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        saveSession(data.accessToken, data.refreshToken, data.user);
        rtRef.current = data.refreshToken;
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleRefresh(data.accessToken);
        return { success: true, message: 'Login successful', user: data.user as User };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch { return { success: false, message: 'Network error occurred' }; }
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    const rt = rtRef.current;
    const at = accessToken;
    if (timerRef.current) clearTimeout(timerRef.current);
    clearSession(); setUser(null); setAccessToken(null); rtRef.current = null;
    if (rt && at) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${at}` },
          body: JSON.stringify({ refreshToken: rt }),
        });
      } catch { /* best-effort */ }
    }
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
