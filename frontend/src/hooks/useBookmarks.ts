import { useState, useCallback } from 'react';
import type { Category } from '../types';

export interface Bookmark {
  title: string;
  summary: string;
  source_url: string;
  city_slug: string;
  date: string;
  source_name: string;
  category: Category;
}

const KEY = 'nearly_bookmarks';

function load(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Bookmark[];
  } catch {
    return [];
  }
}

function persist(bookmarks: Bookmark[]): void {
  localStorage.setItem(KEY, JSON.stringify(bookmarks));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(load);

  const isBookmarked = useCallback(
    (sourceUrl: string) => bookmarks.some((b) => b.source_url === sourceUrl),
    [bookmarks],
  );

  const toggle = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.source_url === bookmark.source_url);
      const next = exists
        ? prev.filter((b) => b.source_url !== bookmark.source_url)
        : [...prev, bookmark];
      persist(next);
      return next;
    });
  }, []);

  return { bookmarks, isBookmarked, toggle };
}
