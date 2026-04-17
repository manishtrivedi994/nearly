import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DigestItem } from '../types';
import type { Bookmark } from '../hooks/useBookmarks';
import type { SearchResultItem } from '../types';
import { Badge } from './ui/Badge';
import { getRelated, postFlag } from '../lib/api';
import { trackEvent } from '../utils/analytics';

interface DigestCardProps {
  item: DigestItem;
  onClick: () => void;
  date?: string;
  isBookmarked?: boolean;
  onBookmark?: (bookmark: Bookmark) => void;
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="M2 2h10v11l-5-3-5 3V2z" />
    </svg>
  );
}

function scoreColor(score: number): string {
  if (score >= 0.8) return '#1D9E75';
  if (score >= 0.5) return '#EF9F27';
  return '#B4B2A9';
}

export function DigestCard({ item, onClick, date, isBookmarked = false, onBookmark }: DigestCardProps) {
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [related, setRelated] = useState<SearchResultItem[] | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagNote, setFlagNote] = useState('');
  const [flagState, setFlagState] = useState<'idle' | 'submitting' | 'done'>('idle');

  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
    trackEvent(isBookmarked ? 'article_unbookmarked' : 'article_bookmarked', {
      city: item.city_slug,
      category: item.category,
      title: item.title,
    });
    onBookmark?.({
      title: item.title,
      summary: item.summary,
      source_url: item.source_url,
      city_slug: item.city_slug,
      date: date ?? '',
      source_name: item.source_name,
      category: item.category,
    });
  }

  function handleRelatedToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!relatedOpen) {
      trackEvent('related_stories_opened', { city: item.city_slug, category: item.category, title: item.title });
      if (related === null) {
        setRelatedLoading(true);
        getRelated(item.city_slug, item.title, item.category)
          .then((res) => { setRelated(res); setRelatedLoading(false); })
          .catch(() => { setRelated([]); setRelatedLoading(false); });
      }
    }
    setRelatedOpen((prev) => !prev);
  }

  function handleFlagToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setFlagOpen((prev) => !prev);
    setFlagReason('');
    setFlagNote('');
    setFlagState('idle');
  }

  function handleFlagSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!flagReason) return;
    setFlagState('submitting');
    postFlag({
      title: item.title,
      city_slug: item.city_slug,
      date: date ?? '',
      reason: flagReason,
      note: flagNote,
    })
      .then(() => {
        setFlagState('done');
        trackEvent('article_flagged', { city: item.city_slug, reason: flagReason, title: item.title });
        setTimeout(() => setFlagOpen(false), 1500);
      })
      .catch(() => setFlagState('idle'));
  }

  return (
    <article
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: 14,
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        overflow: 'hidden',
      }}
    >
      {/* Row 1: badge + source + bookmark */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          to={`/digest/${item.city_slug}/category/${item.category}`}
          onClick={(e) => e.stopPropagation()}
          style={{ textDecoration: 'none' }}
        >
          <Badge category={item.category} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {item.source_name}
          </span>
          {onBookmark && (
            <button
              onClick={handleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                color: isBookmarked ? 'var(--color-brand)' : 'var(--color-text-muted)',
                transition: 'var(--transition-fast)',
              }}
            >
              <BookmarkIcon filled={isBookmarked} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 1.35,
          marginTop: 6,
        }}
      >
        {item.title}
      </div>

      {/* Row 3: summary (5-line clamp) */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          marginTop: 4,
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.summary}
      </div>

      {/* Row 4: read more + source */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--color-text-brand)', fontWeight: 600 }}>
          Read more →
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {item.source_name}
        </span>
      </div>

      {/* Row 5: related stories toggle + flag button */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          onClick={handleRelatedToggle}
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.3px' }}>
            Related stories
          </span>
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)', lineHeight: 1 }}>
            {relatedOpen ? '▲' : '▾'}
          </span>
        </div>

        <button
          onClick={handleFlagToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            color: flagOpen ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            padding: '0 2px',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Flag
        </button>
      </div>

      {/* Related stories list */}
      {relatedOpen && (
        <div style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
          {relatedLoading && (
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>
              Loading…
            </p>
          )}

          {!relatedLoading && related !== null && related.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0 }}>
              No related stories found.
            </p>
          )}

          {!relatedLoading && related && related.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {related.map((r, i) => (
                <a
                  key={i}
                  href={r.item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '6px 0',
                      borderTop: i > 0 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1.35,
                      }}
                    >
                      {r.item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {r.date} · {r.item.source_name}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flag form */}
      {flagOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          {flagState === 'done' ? (
            <p style={{ fontSize: 11, color: '#1D9E75', margin: 0, fontWeight: 600 }}>
              Reported — thanks for the feedback.
            </p>
          ) : (
            <form onSubmit={handleFlagSubmit}>
              {/* Radio options in 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 8 }}>
                {(['Wrong info', 'Outdated', 'Not local', 'Other'] as const).map((r) => (
                  <label
                    key={r}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="flag-reason"
                      value={r}
                      checked={flagReason === r}
                      onChange={() => setFlagReason(r)}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-brand)' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value.slice(0, 100))}
                placeholder="Optional note…"
                rows={2}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 8px',
                  color: 'var(--color-text-primary)',
                  resize: 'none',
                  outline: 'none',
                  marginBottom: 8,
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  {flagNote.length}/100
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleFlagToggle}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', padding: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!flagReason || flagState === 'submitting'}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-sans)',
                      background: flagReason ? 'var(--color-bg-inverse)' : 'var(--color-border-strong)',
                      color: flagReason ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-pill)',
                      padding: '4px 12px',
                      cursor: flagReason ? 'pointer' : 'default',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {flagState === 'submitting' ? 'Sending…' : 'Submit'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Relevance bar — 3px, bleeds to card edges, clipped by overflow:hidden */}
      <div
        title={`AI confidence: ${Math.round(item.relevance_score * 100)}%`}
        style={{ margin: '10px -14px -14px', height: 3, background: 'var(--color-border)' }}
      >
        <div
          style={{
            height: '100%',
            width: `${item.relevance_score * 100}%`,
            background: scoreColor(item.relevance_score),
          }}
        />
      </div>
    </article>
  );
}
