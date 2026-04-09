import { useState, useEffect } from 'react';

const KEY = 'nearly_read_dates';

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function loadDates(): Set<string> {
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

/** Records today as a read date and returns the current consecutive-day streak. */
export function useStreak(): number {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const dates = loadDates();
    dates.add(todayISO());
    localStorage.setItem(KEY, JSON.stringify([...dates]));
    setStreak(calcStreak(dates));
  }, []);

  return streak;
}
