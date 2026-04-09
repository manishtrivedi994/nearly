import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryItems } from '../lib/api';
import { useMeta } from '../hooks/useMeta';
import { Navbar } from '../components/ui/Navbar';
import { Badge } from '../components/ui/Badge';
import type { Category, SearchResultItem } from '../types';

const VALID_CATEGORIES = new Set<string>([
  'civic', 'traffic', 'politics', 'weather', 'business', 'crime', 'culture',
]);

function groupByDate(items: SearchResultItem[]): Map<string, SearchResultItem[]> {
  const map = new Map<string, SearchResultItem[]>();
  for (const r of items) {
    const bucket = map.get(r.date);
    if (bucket) {
      bucket.push(r);
    } else {
      map.set(r.date, [r]);
    }
  }
  return map; // already sorted newest-first from the API
}

export function CategoryPage() {
  const { citySlug = '', category = '' } = useParams<{ citySlug: string; category: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const displayCity = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  useMeta(
    `${category.charAt(0).toUpperCase() + category.slice(1)} in ${displayCity} | nearly.`,
    `Last 30 days of ${category} news in ${displayCity}, curated by AI.`,
  );

  useEffect(() => {
    if (!citySlug || !VALID_CATEGORIES.has(category)) return;
    setLoading(true);
    setError(null);
    getCategoryItems(citySlug, category)
      .then((res) => {
        setItems(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError((err as Error).message ?? 'Failed to load');
        setLoading(false);
      });
  }, [citySlug, category]);

  const grouped = groupByDate(items);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <Navbar
        showBack
        backLabel="Back"
        onBack={() => navigate(`/digest/${citySlug}`)}
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
          {displayCity}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <Badge category={category as Category} />
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-text-inverse)',
            }}
          >
            Last 30 days
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-brand-muted)', marginTop: 4 }}>
          {loading ? '\u00a0' : `${items.length} stor${items.length !== 1 ? 'ies' : 'y'}`}
        </div>
      </div>

      {/* Feed grouped by date */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>
            Loading…
          </p>
        )}

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
            No {category} stories in the last 30 days.
          </p>
        )}

        {[...grouped.entries()].map(([date, dateItems]) => (
          <div key={date}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {date}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dateItems.map((r, i) => (
                <a
                  key={i}
                  href={r.item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <article
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                    style={{
                      background: 'var(--color-bg-surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                        {r.item.source_name}
                      </span>
                      {r.item.area && (
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-bg-secondary)',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                          }}
                        >
                          {r.item.area}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.35,
                        marginTop: 6,
                      }}
                    >
                      {r.item.title}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        marginTop: 4,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {r.item.summary}
                    </div>
                  </article>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
