import type { City, DigestResponse } from '../types';

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
