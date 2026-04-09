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
        <Link to="/"><img src="/nearly-icon.svg" alt="nearly." style={{ width: 32 }} /></Link>
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
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <Link to="/">
          <img src="/nearly-icon.svg" alt="nearly." style={{ width: 36, display: 'block' }} />
        </Link>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {capitalize(digest.city)}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {digest.date} · Generated {new Date(digest.generated_at).toLocaleTimeString()}
          </div>
        </div>
        <Link to={`/archive/${city}`} style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>
          Archive →
        </Link>
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
