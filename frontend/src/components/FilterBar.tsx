import type { Category } from '../types';

const CATEGORIES: Category[] = [
  'civic', 'traffic', 'politics', 'weather', 'business', 'crime', 'culture',
];

interface FilterBarProps {
  selected: Category | 'all';
  onChange: (cat: Category | 'all') => void;
}

export function FilterBar({ selected, onChange }: FilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
      {(['all', ...CATEGORIES] as const).map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{
            padding: '4px 14px',
            borderRadius: 20,
            border: '1px solid #ccc',
            background: selected === cat ? '#1a1a1a' : '#fff',
            color: selected === cat ? '#fff' : '#444',
            cursor: 'pointer',
            fontSize: 13,
            textTransform: 'capitalize',
            fontWeight: selected === cat ? 600 : 400,
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
