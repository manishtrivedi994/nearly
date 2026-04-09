import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { getReadDates, postReadDate } from '../lib/api';

const KEY = 'nearly_read_dates';

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function loadLocalDates(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function calcStreak(dates: Set<string>): number {
  let count = 0;
  const cursor = new Date();
  while (dates.has(cursor.toLocaleDateString('en-CA'))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function useStreak(): { streak: number; markRead: (citySlug: string) => void } {
  const { token } = useAuth();
  const [streak, setStreak] = useState(0);
  const prevTokenRef = useRef<string | null>(null);

  // Load streak from API or localStorage on token change
  useEffect(() => {
    if (!token) {
      prevTokenRef.current = null;
      const dates = loadLocalDates();
      setStreak(calcStreak(dates));
      return;
    }
    prevTokenRef.current = token;
    getReadDates(token)
      .then((rows) => {
        const dates = new Set(rows.map((r) => r.read_date));
        setStreak(calcStreak(dates));
      })
      .catch(() => {});
  }, [token]);

  const markRead = useCallback(
    (citySlug: string) => {
      const today = todayISO();
      if (token) {
        postReadDate(token, today, citySlug).then(() => {
          getReadDates(token)
            .then((rows) => {
              const dates = new Set(rows.map((r) => r.read_date));
              setStreak(calcStreak(dates));
            })
            .catch(() => {});
        }).catch(() => {});
      } else {
        const dates = loadLocalDates();
        dates.add(today);
        localStorage.setItem(KEY, JSON.stringify([...dates]));
        setStreak(calcStreak(dates));
      }
    },
    [token],
  );

  return { streak, markRead };
}
