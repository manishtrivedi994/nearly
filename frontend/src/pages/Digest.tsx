import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDigest } from '../hooks/useDigest';
import { useBookmarks } from '../hooks/useBookmarks';
import { useStreak } from '../hooks/useStreak';
import { getCities } from '../lib/api';
import { DigestCard } from '../components/DigestCard';
import { Navbar } from '../components/ui/Navbar';
import { FilterChip } from '../components/ui/FilterChip';
import type { Category, City } from '../types';

type Filter = Category | 'all';

const SKELETON_COUNT = 3;

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

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
  }, []);

  // Persist last visited city
  useEffect(() => {
    if (citySlug) localStorage.setItem('nearly_last_city', citySlug);
  }, [citySlug]);

  // Reset filter when city changes
  useEffect(() => {
    setFilter('all');
  }, [citySlug]);

  const displayCity = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  const items =
    filter === 'all'
      ? (digest?.items ?? [])
      : (digest?.items ?? []).filter((i) => i.category === filter);

  const uniqueCategories: Category[] = digest
    ? ([...new Set(digest.items.map((i) => i.category))] as Category[])
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
        <div style={{ fontSize: 12, color: 'var(--color-brand-muted)', marginTop: 4 }}>
          {digest ? `${digest.items.length} stories · 2 min read` : '\u00a0'}
        </div>
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
      </div>
    </div>
  );
}
