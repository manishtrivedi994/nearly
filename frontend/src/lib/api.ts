import type { City, DigestResponse, SearchResultItem } from '../types';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getCities(): Promise<City[]> {
  return apiFetch<City[]>(`${BASE}/api/cities`);
}

export function getDigest(city: string, date?: string): Promise<DigestResponse> {
  const path = date
    ? `/api/digest/${encodeURIComponent(city)}/${encodeURIComponent(date)}`
    : `/api/digest/${encodeURIComponent(city)}`;
  return apiFetch<DigestResponse>(`${BASE}${path}`);
}

export function searchDigests(q: string, city?: string): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ q });
  if (city) params.set('city', city);
  return apiFetch<SearchResultItem[]>(`${BASE}/api/search?${params.toString()}`);
}

export async function subscribePush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  citySlug: string,
): Promise<void> {
  const res = await fetch(`${BASE}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...subscription, citySlug }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}

export async function triggerRun(password: string, citySlug?: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/trigger-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
    body: JSON.stringify(citySlug ? { citySlug } : {}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
