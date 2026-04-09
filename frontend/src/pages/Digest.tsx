import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDigest } from '../hooks/useDigest';
import { DigestCard } from '../components/DigestCard';
import { FilterBar } from '../components/FilterBar';
import type { Category } from '../types';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Digest() {
  const { city = '' } = useParams<{ city: string }>();
  const { digest, loading, error } = useDigest(city);
  const [filter, setFilter] = useState<Category | 'all'>('all');

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading…</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
        <Link to="/">← Cities</Link>
        <p style={{ color: '#c00', marginTop: 16 }}>{error}</p>
      </div>
    );
  }

  if (!digest) return null;

  const items =
    filter === 'all' ? digest.items : digest.items.filter((i) => i.category === filter);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
      }}>
        <div>
          <Link to="/" style={{ fontSize: 14 }}>← Cities</Link>
          <h2 style={{ margin: '6px 0 2px', fontSize: 22 }}>
            {capitalize(digest.city)} — {digest.date}
          </h2>
          <span style={{ fontSize: 12, color: '#999' }}>
            Generated {new Date(digest.generated_at).toLocaleTimeString()}
          </span>
        </div>
        <Link to={`/archive/${city}`} style={{ fontSize: 14, marginTop: 4 }}>Archive →</Link>
      </div>

      <FilterBar selected={filter} onChange={setFilter} />

      {items.length === 0 ? (
        <p style={{ color: '#888' }}>No items match this filter.</p>
      ) : (
        items.map((item, i) => <DigestCard key={i} item={item} />)
      )}
    </div>
  );
}
