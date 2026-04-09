import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDigest } from '../hooks/useDigest';
import { DigestCard } from '../components/DigestCard';

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Archive() {
  const { city = '' } = useParams<{ city: string }>();
  const [date, setDate] = useState(todayLocal());
  const { digest, loading, error } = useDigest(city, date);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to={`/digest/${city}`} style={{ fontSize: 14 }}>← Today's digest</Link>
        <h2 style={{ margin: '6px 0', fontSize: 22 }}>{capitalize(city)} — archive</h2>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="date-picker" style={{ marginRight: 8, fontSize: 14 }}>Date:</label>
        <input
          id="date-picker"
          type="date"
          value={date}
          max={todayLocal()}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
        />
      </div>

      {loading && <p style={{ color: '#666' }}>Loading…</p>}
      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {!loading && !error && digest && (
        <>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
            {digest.items.length} item{digest.items.length !== 1 ? 's' : ''}
          </p>
          {digest.items.map((item, i) => <DigestCard key={i} item={item} />)}
        </>
      )}
    </div>
  );
}
