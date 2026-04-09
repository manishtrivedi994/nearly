import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import type { DigestItem } from '../types';
import { Navbar } from '../components/ui/Navbar';
import { Badge } from '../components/ui/Badge';

interface LocationState {
  item: DigestItem;
  items: DigestItem[];
  date?: string;
}

function isLocationState(v: unknown): v is LocationState {
  return (
    typeof v === 'object' &&
    v !== null &&
    'item' in v &&
    'items' in v
  );
}

function scoreColor(score: number): string {
  if (score >= 0.8) return '#1D9E75';
  if (score >= 0.5) return '#EF9F27';
  return '#B4B2A9';
}

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        color: 'var(--color-text-muted)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export function DigestDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLocationState(location.state)) {
      navigate(-1);
    }
  }, [location.state, navigate]);

  if (!isLocationState(location.state)) return null;

  const { item, items, date } = location.state;

  const related = items
    .filter((i) => i !== item && i.category === item.category)
    .slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <Navbar showBack onBack={() => navigate(-1)} backLabel="Today's digest" />

      {/* Hero band */}
      <div style={{ background: 'var(--color-bg-inverse)', padding: '16px' }}>
        <Badge category={item.category} />
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--color-text-inverse)',
            lineHeight: 1.3,
            marginTop: 8,
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-brand-on-dark)',
            marginTop: 6,
          }}
        >
          {item.source_name}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>

        {/* Summary — full text, larger than card */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {item.summary}
        </p>

        {/* Metadata row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
            marginTop: 14,
          }}
        >
          <Chip label={item.city_slug.charAt(0).toUpperCase() + item.city_slug.slice(1)} />
          {item.area && item.area !== 'null' && <Chip label={item.area} />}
          {date && <Chip label={date} />}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: scoreColor(item.relevance_score),
              background: 'var(--color-bg-secondary)',
              border: `1px solid ${scoreColor(item.relevance_score)}`,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              whiteSpace: 'nowrap',
            }}
          >
            AI confidence: {Math.round(item.relevance_score * 100)}%
          </span>
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />

        {related.length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              More from today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {related.map((rel, i) => (
                <div
                  key={i}
                  onClick={() =>
                    navigate(location.pathname.replace(/\/item\/\d+$/, '') + `/item/${items.indexOf(rel)}`, {
                      state: { item: rel, items },
                    })
                  }
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.35,
                    }}
                  >
                    {rel.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      marginTop: 3,
                    }}
                  >
                    {rel.source_name}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />
          </>
        )}

        {/* Read full article button */}
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 11,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-brand)',
            textAlign: 'center',
            margin: '0 0',
          }}
        >
          Read full article
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 8.5L8.5 3.5M8.5 3.5H5M8.5 3.5V7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
