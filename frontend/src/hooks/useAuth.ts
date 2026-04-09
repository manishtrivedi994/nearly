import { createContext, useContext, useState, useCallback, type ReactNode, createElement } from 'react';

const STORAGE_KEY = 'nearly_token';

export interface AuthUser {
  id: number;
  email: string;
  city_slug: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): AuthUser | null {
  try {
    // JWT payload is base64url — convert to standard base64 before atob
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64)) as {
      sub?: unknown;
      email?: unknown;
      city_slug?: unknown;
      exp?: unknown;
    };
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.sub !== 'number' || typeof payload.email !== 'string') return null;
    return {
      id: payload.sub,
      email: payload.email,
      city_slug: typeof payload.city_slug === 'string' ? payload.city_slug : null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    // Discard expired token on mount
    if (!decodeToken(stored)) { localStorage.removeItem(STORAGE_KEY); return null; }
    return stored;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? decodeToken(stored) : null;
  });

  const login = useCallback((newToken: string) => {
    const decoded = decodeToken(newToken);
    if (!decoded) return;
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(decoded);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return createElement(AuthContext.Provider, { value: { user, token, login, logout } }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
