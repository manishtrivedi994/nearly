import { useState, useEffect } from 'react';
import { getDigest } from '../lib/api';
import type { DigestResponse } from '../types';

interface UseDigestResult {
  digest: DigestResponse | null;
  loading: boolean;
  error: string | null;
}

export function useDigest(city: string, date?: string): UseDigestResult {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDigest(null);

    getDigest(city, date)
      .then((data) => {
        if (!cancelled) {
          setDigest(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as Error).message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [city, date]);

  return { digest, loading, error };
}
