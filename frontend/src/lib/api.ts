import type { City, DigestResponse, SearchResultItem } from '../types';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

// Hooks register a logout callback here so stale-token 401s auto-sign-out the user.
let _onStaleToken: (() => void) | null = null;
export function registerStaleTokenHandler(fn: () => void) { _onStaleToken = fn; }
export function clearStaleTokenHandler() { _onStaleToken = null; }

function handleStaleToken() { _onStaleToken?.(); }

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Wraps a fetch against /api/me/* — calls logout on 401 (stale JWT)
export async function meFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, init);
  if (res.status === 401) { handleStaleToken(); return null; }
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

export function getRelated(city: string, title: string, category: string): Promise<SearchResultItem[]> {
  const params = new URLSearchParams({ title, category });
  return apiFetch<SearchResultItem[]>(
    `${BASE}/api/digest/${encodeURIComponent(city)}/related?${params.toString()}`,
  );
}

export function getCategoryItems(city: string, category: string): Promise<SearchResultItem[]> {
  return apiFetch<SearchResultItem[]>(
    `${BASE}/api/digest/${encodeURIComponent(city)}/category/${encodeURIComponent(category)}`,
  );
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

export async function postFlag(payload: {
  title: string;
  city_slug: string;
  date: string;
  reason: string;
  note: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/api/flag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}

// ─── /api/me — authenticated user data ───────────────────────────────────────

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export interface ApiBookmark {
  id: number;
  title: string;
  summary: string;
  source_url: string;
  city_slug: string;
  digest_date: string;
  source_name: string;
  category: string;
  saved_at: string;
}

export interface ApiPreferences {
  last_city: string | null;
  language: string;
}

export async function getBookmarks(token: string): Promise<ApiBookmark[]> {
  return await meFetch<ApiBookmark[]>(`${BASE}/api/me/bookmarks`, {
    headers: { Authorization: `Bearer ${token}` },
  }) ?? [];
}

export async function addBookmark(token: string, data: Omit<ApiBookmark, 'id' | 'saved_at'>): Promise<ApiBookmark | null> {
  return meFetch<ApiBookmark>(`${BASE}/api/me/bookmarks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function removeBookmark(token: string, id: number): Promise<void> {
  await meFetch<unknown>(`${BASE}/api/me/bookmarks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function getReadDates(token: string): Promise<{ id: number; read_date: string; city_slug: string }[]> {
  return await meFetch<{ id: number; read_date: string; city_slug: string }[]>(
    `${BASE}/api/me/read-dates`, { headers: { Authorization: `Bearer ${token}` } },
  ) ?? [];
}

export async function postReadDate(token: string, read_date: string, city_slug: string): Promise<void> {
  await meFetch<unknown>(`${BASE}/api/me/read-dates`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ read_date, city_slug }),
  });
}

export async function getPreferences(token: string): Promise<ApiPreferences> {
  return await meFetch<ApiPreferences>(`${BASE}/api/me/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  }) ?? { last_city: null, language: 'en' };
}

export async function patchPreferences(token: string, data: Partial<ApiPreferences>): Promise<void> {
  await meFetch<unknown>(`${BASE}/api/me/preferences`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function signup(email: string, password: string, city_slug?: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, city_slug: city_slug ?? null }),
  });
  const body = await res.json().catch(() => ({})) as { token?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  if (!body.token) throw new Error('No token in response');
  return body.token;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({})) as { token?: string; error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  if (!body.token) throw new Error('No token in response');
  return body.token;
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
