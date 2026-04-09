import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDigest } from '../hooks/useDigest';
import { useBookmarks } from '../hooks/useBookmarks';
import { useStreak } from '../hooks/useStreak';
import { getCities, subscribePush } from '../lib/api';
import { DigestCard } from '../components/DigestCard';
import { Navbar } from '../components/ui/Navbar';
import { FilterChip } from '../components/ui/FilterChip';
import type { Category, City } from '../types';

type Filter = Category | 'all';

const SKELETON_COUNT = 3;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: 14,
      }}
    >
      <div
        style={{
          height: 16,
          width: 60,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-border-strong)',
          animation: 'pulse 1.4s ease infinite',
          marginBottom: 10,
        }}
      />
      <div
        style={{
          height: 13,
          width: '85%',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-border)',
          animation: 'pulse 1.4s ease infinite',
          marginBottom: 6,
        }}
      />
      <div
        style={{
          height: 11,
          width: '65%',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-border)',
          animation: 'pulse 1.4s ease infinite 0.2s',
        }}
      />
    </div>
  );
}

export function Digest() {
  const { citySlug = '', date } = useParams<{ citySlug: string; date?: string }>();
  const { digest, loading, error } = useDigest(citySlug, date);
  const [filter, setFilter] = useState<Filter>('all');
  const [cities, setCities] = useState<City[]>([]);
  const navigate = useNavigate();
  const { isBookmarked, toggle } = useBookmarks();
  const streak = useStreak();
  const [copied, setCopied] = useState(false);
  const [notifyState, setNotifyState] = useState<'idle' | 'loading' | 'subscribed' | 'denied'>('idle');
  const [areaFilter, setAreaFilter] = useState<string | 'all'>('all');
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const pushSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
  }, []);

  // Persist last visited city
  useEffect(() => {
    if (citySlug) localStorage.setItem('nearly_last_city', citySlug);
  }, [citySlug]);

  // Reset filters when city changes
  useEffect(() => {
    setFilter('all');
    setAreaFilter('all');
  }, [citySlug]);

  const displayCity = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  async function handleNotify() {
    if (!pushSupported) return;
    setNotifyState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setNotifyState('denied'); return; }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';
      const appKey = urlBase64ToUint8Array(vapidKey);

      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
      const rawP256 = sub.getKey('p256dh');
      const rawAuth = sub.getKey('auth');
      if (!rawP256 || !rawAuth) throw new Error('Missing push keys');

      await subscribePush(
        { endpoint: sub.endpoint, keys: { p256dh: bufToBase64(rawP256), auth: bufToBase64(rawAuth) } },
        citySlug,
      );
      setNotifyState('subscribed');
    } catch {
      setNotifyState('idle');
    }
  }

  async function handleShare() {
    if (!digest) return;
    const lines = digest.items
      .slice(0, 5)
      .map((item, i) => `${i + 1}. ${item.title}`)
      .join('\n');
    const text = `Today in ${displayCity} via nearly.\n\n${lines}\n\nnearly.app/digest/${citySlug}`;

    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const allItems = digest?.items ?? [];

  const items = allItems
    .filter((i) => filter === 'all' || i.category === filter)
    .filter((i) => areaFilter === 'all' || i.area === areaFilter);

  const uniqueCategories: Category[] = digest
    ? ([...new Set(digest.items.map((i) => i.category))] as Category[])
    : [];

  const uniqueAreas: string[] = digest
    ? [...new Set(
        digest.items
          .map((i) => i.area)
          .filter((a): a is string => typeof a === 'string' && a.trim() !== '' && a !== 'null'),
      )].sort()
    : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <Navbar
        city={displayCity}
        cities={cities}
        onCitySelect={(slug) => navigate(`/digest/${slug}`)}
        onLogoClick={() => navigate('/')}
        archiveHref={`/digest/${citySlug}/archive`}
        streak={streak}
      />

      {/* Hero band */}
      <div style={{ background: 'var(--color-bg-inverse)', padding: '20px 16px' }}>
        <div
          style={{
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            fontSize: 11,
            color: 'var(--color-text-brand-on-dark)',
          }}
        >
          {digest?.date ?? new Date().toISOString().slice(0, 10)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-text-inverse)',
            lineHeight: 1.3,
            marginTop: 4,
          }}
        >
          {date ? 'Past digest' : 'Today in your city'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--color-brand-muted)' }}>
            {digest ? `${digest.items.length} stories · 2 min read` : '\u00a0'}
          </span>
          {digest && digest.items.length > 0 && (
            <button
              onClick={handleShare}
              style={{
                background: 'none',
                border: '1px solid var(--color-text-brand-on-dark)',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 500,
                color: copied ? 'var(--color-brand-muted)' : 'var(--color-text-brand-on-dark)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied!' : 'Share digest'}
            </button>
          )}
        </div>
        {pushSupported && !date && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={handleNotify}
              disabled={notifyState === 'loading' || notifyState === 'subscribed'}
              style={{
                background: 'none',
                border: '1px solid var(--color-text-brand-on-dark)',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 500,
                color: notifyState === 'subscribed'
                  ? 'var(--color-brand-muted)'
                  : notifyState === 'denied'
                    ? 'var(--color-text-muted)'
                    : 'var(--color-text-brand-on-dark)',
                cursor: notifyState === 'loading' || notifyState === 'subscribed' ? 'default' : 'pointer',
                transition: 'var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
                opacity: notifyState === 'loading' ? 0.6 : 1,
              }}
            >
              {notifyState === 'idle' && 'Notify me'}
              {notifyState === 'loading' && 'Subscribing…'}
              {notifyState === 'subscribed' && 'Subscribed'}
              {notifyState === 'denied' && 'Notifications blocked'}
            </button>
          </div>
        )}
      </div>

      {/* Filter row */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          background: 'var(--color-bg-primary)',
          borderBottom: '1px solid var(--color-border)',
          overflowX: 'auto',
          msOverflowStyle: 'none',
        }}
      >
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        {uniqueCategories.map((cat) => (
          <FilterChip
            key={cat}
            label={cat.charAt(0).toUpperCase() + cat.slice(1)}
            active={filter === cat}
            onClick={() => setFilter(cat)}
          />
        ))}
      </div>

      {/* Area filter row — only rendered when digest has area-tagged items */}
      {uniqueAreas.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 16px',
            background: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-border)',
            overflowX: 'auto',
            msOverflowStyle: 'none',
          }}
        >
          <FilterChip label="All areas" active={areaFilter === 'all'} onClick={() => setAreaFilter('all')} />
          {uniqueAreas.map((area) => (
            <FilterChip
              key={area}
              label={area}
              active={areaFilter === area}
              onClick={() => setAreaFilter(area)}
            />
          ))}
        </div>
      )}

      {/* Feed */}
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {loading && Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} />)}

        {error && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginTop: 40,
              fontSize: 14,
            }}
          >
            No digest yet for today. Check back later.
          </p>
        )}

        {!loading &&
          items.map((item, i) => (
            <DigestCard
              key={i}
              item={item}
              date={digest?.date}
              isBookmarked={isBookmarked(item.source_url)}
              onBookmark={toggle}
              onClick={() =>
                navigate(`/digest/${citySlug}/item/${i}`, {
                  state: { item, items: digest?.items ?? [] },
                })
              }
            />
          ))}

        {/* Sources transparency */}
        {!loading && digest && digest.sources.length > 0 && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            <button
              onClick={() => setSourcesOpen((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.3px' }}>
                Sources used today ({digest.sources.length})
              </span>
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                {sourcesOpen ? '▲' : '▾'}
              </span>
            </button>

            {sourcesOpen && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '6px 0' }}>
                {digest.sources.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 14px',
                    }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {s.source_name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-bg-secondary)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      {s.count} {s.count === 1 ? 'article' : 'articles'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
