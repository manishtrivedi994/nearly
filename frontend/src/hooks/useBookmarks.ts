import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { getBookmarks, addBookmark, removeBookmark } from '../lib/api';
import type { ApiBookmark } from '../lib/api';
import type { Category } from '../types';

export interface Bookmark {
  id?: number;
  title: string;
  summary: string;
  source_url: string;
  city_slug: string;
  date: string;
  source_name: string;
  category: Category;
}

const KEY = 'nearly_bookmarks';

function loadLocal(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Bookmark[];
  } catch {
    return [];
  }
}

function persistLocal(bookmarks: Bookmark[]): void {
  localStorage.setItem(KEY, JSON.stringify(bookmarks));
}

function apiToBookmark(b: ApiBookmark): Bookmark {
  return {
    id: b.id,
    title: b.title,
    summary: b.summary,
    source_url: b.source_url,
    city_slug: b.city_slug,
    date: b.digest_date,
    source_name: b.source_name,
    category: b.category as Category,
  };
}

export function useBookmarks() {
  const { user, token } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => (user ? [] : loadLocal()));
  const prevTokenRef = useRef<string | null>(null);

  // Load from API when token is available (or changes)
  useEffect(() => {
    if (!token) {
      // Logged out — use localStorage
      if (prevTokenRef.current !== null) {
        // Just logged out, state was already cleared by useAuth logout
        setBookmarks(loadLocal());
      }
      prevTokenRef.current = null;
      return;
    }
    prevTokenRef.current = token;
    getBookmarks(token).then((rows) => setBookmarks(rows.map(apiToBookmark))).catch(() => {});
  }, [token]);

  const isBookmarked = useCallback(
    (sourceUrl: string) => bookmarks.some((b) => b.source_url === sourceUrl),
    [bookmarks],
  );

  const toggle = useCallback(
    (bookmark: Bookmark) => {
      if (token) {
        const existing = bookmarks.find((b) => b.source_url === bookmark.source_url);
        if (existing?.id != null) {
          removeBookmark(token, existing.id)
            .then(() => setBookmarks((prev) => prev.filter((b) => b.source_url !== bookmark.source_url)))
            .catch(() => {});
        } else {
          addBookmark(token, {
            title: bookmark.title,
            summary: bookmark.summary,
            source_url: bookmark.source_url,
            city_slug: bookmark.city_slug,
            digest_date: bookmark.date,
            source_name: bookmark.source_name,
            category: bookmark.category,
          })
            .then((saved) => { if (saved) setBookmarks((prev) => [...prev, apiToBookmark(saved)]); })
            .catch(() => {});
        }
      } else {
        setBookmarks((prev) => {
          const exists = prev.some((b) => b.source_url === bookmark.source_url);
          const next = exists
            ? prev.filter((b) => b.source_url !== bookmark.source_url)
            : [...prev, bookmark];
          persistLocal(next);
          return next;
        });
      }
    },
    [token, bookmarks],
  );

  return { bookmarks, isBookmarked, toggle };
}
