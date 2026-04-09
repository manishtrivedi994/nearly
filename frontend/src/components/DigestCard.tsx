import type { DigestItem } from '../types';
import { Badge } from './ui/Badge';

interface DigestCardProps {
  item: DigestItem;
  onClick: () => void;
}

export function DigestCard({ item, onClick }: DigestCardProps) {
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
      {/* Row 1: badge + source */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Badge category={item.category} />
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {item.source_name}
        </span>
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

      {/* Row 3: summary (2-line clamp) */}
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
        {item.summary}
      </div>

      {/* Row 4: read more + time */}
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
