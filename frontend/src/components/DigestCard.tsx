import type { DigestItem, Category } from '../types';

const CATEGORY_COLORS: Record<Category, string> = {
  civic:    '#2196F3',
  traffic:  '#FF9800',
  politics: '#9C27B0',
  weather:  '#00BCD4',
  business: '#4CAF50',
  crime:    '#F44336',
  culture:  '#FF5722',
};

interface DigestCardProps {
  item: DigestItem;
}

export function DigestCard({ item }: DigestCardProps) {
  return (
    <article style={{
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: '16px',
      marginBottom: 12,
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          background: CATEGORY_COLORS[item.category],
          color: '#fff',
          borderRadius: 4,
          padding: '2px 9px',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {item.category}
        </span>
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, lineHeight: 1.4 }}>{item.title}</h3>
      <p style={{ margin: '0 0 12px', color: '#555', fontSize: 14, lineHeight: 1.6 }}>{item.summary}</p>
      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}
      >
        {item.source_name} ↗
      </a>
    </article>
  );
}
