import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchDigests } from '../lib/api';
import { useMeta } from '../hooks/useMeta';
import { Navbar } from '../components/ui/Navbar';
import { Badge } from '../components/ui/Badge';
import type { SearchResultItem } from '../types';
import { trackEvent } from '../utils/analytics';

// Wraps matching tokens in <mark> elements for highlighting.
function highlight(text: string, query: string): React.ReactNode {
  const terms = query
    .replace(/["*()\-+^]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return text;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{
          background: '#FFF3B0',
          color: 'inherit',
          borderRadius: 2,
          padding: '0 1px',
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function groupByDate(results: SearchResultItem[]): Map<string, SearchResultItem[]> {
  const map = new Map<string, SearchResultItem[]>();
  for (const r of results) {
    const bucket = map.get(r.date);
    if (bucket) {
      bucket.push(r);
    } else {
      map.set(r.date, [r]);
    }
  }
  // Sort dates descending
  return new Map([...map.entries()].sort(([a], [b]) => b.localeCompare(a)));
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const q = searchParams.get('q') ?? '';
  useMeta(
    q ? `"${q}" — Search | nearly.` : 'Search | nearly.',
    'Search local news stories across all cities on nearly.',
  );

  const runSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    searchDigests(trimmed)
      .then((res) => {
        setResults(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError((err as Error).message ?? 'Search failed');
        setLoading(false);
      });
  }, []);

  // Run search whenever `q` in URL changes
  useEffect(() => {
    if (q.length >= 2) {
      setInputValue(q);
      runSearch(q);
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [q, runSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    trackEvent('search_performed', { query: trimmed });
    setSearchParams({ q: trimmed });
  }

  const grouped = groupByDate(results);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <Navbar onLogoClick={() => navigate('/')} />

      <div style={{ padding: '20px 16px 0' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search stories…"
            style={{
              flex: 1,
              height: 38,
              padding: '0 12px',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              height: 38,
              padding: '0 16px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              background: 'var(--color-bg-inverse)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        {q && (
          <p
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 8,
            }}
          >
            {loading
              ? 'Searching…'
              : searched
                ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
                : ''}
          </p>
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 24 }}>
            {error}
          </p>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginTop: 40,
              fontSize: 14,
            }}
          >
            No results found for &ldquo;{q}&rdquo;
          </p>
        )}

        {[...grouped.entries()].map(([date, dateResults]) => (
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
              {dateResults.map((r, i) => (
                <SearchCard key={i} result={r} query={q} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SearchCardProps {
  result: SearchResultItem;
  query: string;
}

function SearchCard({ result, query }: SearchCardProps) {
  const { item } = result;

  return (
    <a
      href={item.source_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
      onClick={() => trackEvent('search_result_clicked', { city: result.city_slug, category: item.category, title: item.title, query })}
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
          <Badge category={item.category} />
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {result.city_slug} · {item.source_name}
          </span>
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
          {highlight(item.title, query)}
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
          {highlight(item.summary, query)}
        </div>
      </article>
    </a>
  );
}
