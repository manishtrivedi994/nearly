import { Link } from 'react-router-dom';
import type { DigestItem } from '../types';
import type { Bookmark } from '../hooks/useBookmarks';
import { Badge } from './ui/Badge';

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

export function DigestCard({ item, onClick, date, isBookmarked = false, onBookmark }: DigestCardProps) {
  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation();
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
    </article>
  );
}
