import type { Category } from '../../types';

interface BadgeProps {
  category: Category;
}

export function Badge({ category }: BadgeProps) {
  return (
    <span
      style={{
        background: `var(--color-badge-${category}-bg)`,
        color: `var(--color-badge-${category}-text)`,
        fontSize: 10,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'inline-block',
      }}
    >
      {category}
    </span>
  );
}
