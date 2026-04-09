import { createContext, useContext, useState, useCallback, type ReactNode, createElement } from 'react';
import { getPreferences, patchPreferences, addBookmark, postReadDate } from '../lib/api';

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

/** Silently migrate localStorage data to the DB after a fresh login/signup. */
async function migrateLocalStorage(newToken: string): Promise<void> {
  try {
    // Migrate bookmarks
    const rawBookmarks = localStorage.getItem('nearly_bookmarks');
    if (rawBookmarks) {
      const bookmarks = JSON.parse(rawBookmarks) as {
        title?: unknown;
        summary?: unknown;
        source_url?: unknown;
        city_slug?: unknown;
        date?: unknown;
        source_name?: unknown;
        category?: unknown;
      }[];
      for (const b of bookmarks) {
        if (
          typeof b.title === 'string' &&
          typeof b.summary === 'string' &&
          typeof b.source_url === 'string' &&
          typeof b.city_slug === 'string' &&
          typeof b.date === 'string'
        ) {
          await addBookmark(newToken, {
            title: b.title,
            summary: b.summary,
            source_url: b.source_url,
            city_slug: b.city_slug,
            digest_date: b.date,
            source_name: typeof b.source_name === 'string' ? b.source_name : '',
            category: typeof b.category === 'string' ? b.category : '',
          }).catch(() => {});
        }
      }
      localStorage.removeItem('nearly_bookmarks');
    }

    // Migrate read dates
    const rawDates = localStorage.getItem('nearly_read_dates');
    if (rawDates) {
      const dates = JSON.parse(rawDates) as unknown[];
      for (const d of dates) {
        if (typeof d === 'string') {
          await postReadDate(newToken, d, '').catch(() => {});
        }
      }
      localStorage.removeItem('nearly_read_dates');
    }

    // Migrate + sync last_city preference
    const lastCity = localStorage.getItem('nearly_last_city');
    if (lastCity) {
      await patchPreferences(newToken, { last_city: lastCity }).catch(() => {});
    }
  } catch {
    // Migration is best-effort — never block login
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
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

    // Background: migrate localStorage data + sync preferences
    void migrateLocalStorage(newToken);
    void getPreferences(newToken).then((prefs) => {
      if (prefs.last_city) {
        localStorage.setItem('nearly_last_city', prefs.last_city);
      }
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Clear all user-specific localStorage keys
    localStorage.removeItem('nearly_bookmarks');
    localStorage.removeItem('nearly_read_dates');
    localStorage.removeItem('nearly_last_city');
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
