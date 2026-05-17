'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';

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
  authFetch: typeof fetch;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_SKEW_MS = 90_000;
const AUTH_ROUTES = new Set([
  '/api/auth/login',
  '/api/auth/admin/login',
  '/api/auth/superadmin/login',
  '/api/auth/refresh',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/auth/me',
]);

function msUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 - Date.now();
  } catch {
    return 0;
  }
}

function needsImmediateSessionCheck(pathname: string): boolean {
  return /^\/(admin|dashboard|superadmin|login|signup|reset-password|init-superadmin)(\/|$)/.test(
    pathname
  );
}

function isProtectedPage(pathname: string): boolean {
  return /^\/(admin|dashboard|superadmin)(\/|$)/.test(pathname);
}

function scheduleIdleTask(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }

  const id = globalThis.setTimeout(callback, 1800);
  return () => globalThis.clearTimeout(id);
}

function normalizeUrl(input: RequestInfo | URL) {
  if (typeof window === 'undefined') return null;
  const raw = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
  try {
    return new URL(raw, window.location.origin);
  } catch {
    return null;
  }
}

function readJsonSafely(response: Response) {
  return response.json().catch(() => ({}));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const accessTokenRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const nativeFetchRef = useRef<typeof fetch | null>(null);
  const logoutStartedRef = useRef(false);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const clearRefreshTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const redirectToLogin = useCallback(() => {
    if (typeof window === 'undefined') return;
    const path = `${window.location.pathname}${window.location.search}`;
    if (!isProtectedPage(window.location.pathname)) return;
    window.location.assign(`/login?redirect=${encodeURIComponent(path)}`);
  }, []);

  const clearSession = useCallback(
    (redirect = false) => {
      clearRefreshTimer();
      accessTokenRef.current = null;
      setAccessToken(null);
      setUser(null);
      if (redirect) redirectToLogin();
    },
    [clearRefreshTimer, redirectToLogin]
  );

  const scheduleRefresh = useCallback(
    (token: string) => {
      clearRefreshTimer();
      const delay = msUntilExpiry(token) - REFRESH_SKEW_MS;
      timerRef.current = setTimeout(
        () => {
          void refreshTokenSilently();
        },
        Math.max(delay, 0)
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearRefreshTimer]
  );

  const refreshTokenSilently = useCallback(async (): Promise<string | null> => {
    if (logoutStartedRef.current) return null;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const runner = (async () => {
      try {
        const fetcher = nativeFetchRef.current || window.fetch.bind(window);
        const response = await fetcher('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'x-skip-auth-refresh': '1' },
        });

        const data = await readJsonSafely(response);
        if (!response.ok || !data.success || !data.accessToken) {
          clearSession(true);
          return null;
        }

        accessTokenRef.current = data.accessToken;
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleRefresh(data.accessToken);
        return data.accessToken as string;
      } catch {
        clearSession(true);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = runner;
    return runner;
  }, [clearSession, scheduleRefresh]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const fetcher = nativeFetchRef.current || window.fetch.bind(window);
      const url = normalizeUrl(input);
      const sameOrigin = !url || url.origin === window.location.origin;
      const isAuthRoute = !!url && AUTH_ROUTES.has(url.pathname);
      const skipRefresh = new Headers(init.headers).has('x-skip-auth-refresh');
      const headers = new Headers(init.headers);

      if (sameOrigin && !isAuthRoute && accessTokenRef.current && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessTokenRef.current}`);
      }

      const requestInit = { ...init, headers };
      const response = await fetcher(input, requestInit);

      if (response.status !== 401 || isAuthRoute || skipRefresh || !sameOrigin) {
        return response;
      }

      const newAccessToken = await refreshTokenSilently();
      if (!newAccessToken) return response;

      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      retryHeaders.set('x-skip-auth-refresh', '1');
      return fetcher(input, { ...init, headers: retryHeaders });
    },
    [refreshTokenSilently]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!nativeFetchRef.current) nativeFetchRef.current = window.fetch.bind(window);
    const previousFetch = window.fetch;
    window.fetch = authFetch;

    return () => {
      window.fetch = previousFetch;
    };
  }, [authFetch]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      try {
        const fetcher = nativeFetchRef.current || window.fetch.bind(window);
        const response = await fetcher('/api/auth/me', {
          credentials: 'include',
          headers: { 'x-skip-auth-refresh': '1' },
        });
        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          accessTokenRef.current = data.accessToken;
          setAccessToken(data.accessToken);
          setUser(data.user);
          scheduleRefresh(data.accessToken);
        } else {
          clearSession(false);
        }
      } catch {
        if (!cancelled) clearSession(false);
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    };

    const pathname = window.location.pathname;
    const immediate = needsImmediateSessionCheck(pathname);

    if (immediate) {
      void restoreSession(true);
    } else {
      setLoading(false);
      const cancelIdleTask = scheduleIdleTask(() => {
        void restoreSession(false);
      });

      return () => {
        cancelled = true;
        cancelIdleTask();
        clearRefreshTimer();
      };
    }

    return () => {
      cancelled = true;
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, clearSession, scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        logoutStartedRef.current = false;
        const fetcher = nativeFetchRef.current || window.fetch.bind(window);
        const response = await fetcher('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-skip-auth-refresh': '1' },
          body: JSON.stringify({ email, password }),
        });
        const data = await readJsonSafely(response);

        if (response.ok && data.success) {
          accessTokenRef.current = data.accessToken;
          setAccessToken(data.accessToken);
          setUser(data.user);
          scheduleRefresh(data.accessToken);
          return { success: true, message: 'Login successful', user: data.user as User };
        }

        return { success: false, message: data.message || 'Login failed' };
      } catch {
        return { success: false, message: 'Network error occurred' };
      }
    },
    [scheduleRefresh]
  );

  const logout = useCallback(async () => {
    logoutStartedRef.current = true;
    clearRefreshTimer();
    const token = accessTokenRef.current;
    accessTokenRef.current = null;
    setUser(null);
    setAccessToken(null);

    try {
      const fetcher = nativeFetchRef.current || window.fetch.bind(window);
      await fetcher('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-skip-auth-refresh': '1',
        },
      });
    } catch {
      // Best effort. Local session is already cleared.
    }
  }, [clearRefreshTimer]);

  const refreshToken = useCallback(
    async () => !!(await refreshTokenSilently()),
    [refreshTokenSilently]
  );

  const authHeaders = useCallback(
    (): Record<string, string> =>
      accessTokenRef.current ? { Authorization: `Bearer ${accessTokenRef.current}` } : {},
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        accessToken,
        authHeaders,
        authFetch,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
