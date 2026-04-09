import { useNavigate } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks';
import type { Bookmark } from '../hooks/useBookmarks';
import { Navbar } from '../components/ui/Navbar';
import { Badge } from '../components/ui/Badge';

function BookmarkCard({ bookmark, onRemove }: { bookmark: Bookmark; onRemove: () => void }) {
  return (
    <article
      style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: 14,
      }}
    >
      {/* Row 1: badge + city/date + remove */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge category={bookmark.category} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {bookmark.city_slug} · {bookmark.date}
          </span>
          <button
            onClick={onRemove}
            aria-label="Remove bookmark"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-brand)',
              transition: 'var(--transition-fast)',
            }}
          >
            {/* filled bookmark icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M2 2h10v11l-5-3-5 3V2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 1.35,
          marginTop: 6,
        }}
      >
        {bookmark.title}
      </div>

      {/* Summary */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          marginTop: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {bookmark.summary}
      </div>

      {/* Read link */}
      <div style={{ marginTop: 8 }}>
        <a
          href={bookmark.source_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: 'var(--color-text-brand)', fontWeight: 600 }}
        >
          {bookmark.source_name} ↗
        </a>
      </div>
    </article>
  );
}

export function Bookmarks() {
  const navigate = useNavigate();
  const { bookmarks, toggle } = useBookmarks();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <Navbar onLogoClick={() => navigate('/')} />

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
          Saved stories
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
          Bookmarks
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-brand-muted)', marginTop: 4 }}>
          {bookmarks.length} {bookmarks.length === 1 ? 'story' : 'stories'} saved
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bookmarks.length === 0 ? (
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginTop: 48,
              fontSize: 14,
            }}
          >
            No bookmarks yet. Tap the bookmark icon on any story to save it.
          </p>
        ) : (
          [...bookmarks].reverse().map((bookmark) => (
            <BookmarkCard
              key={bookmark.source_url}
              bookmark={bookmark}
              onRemove={() => toggle(bookmark)}
            />
          ))
        )}
      </div>
    </div>
  );
}
