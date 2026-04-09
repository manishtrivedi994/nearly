import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities } from '../lib/api';
import type { City } from '../types';

export function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCities()
      .then((data) => {
        const stored = localStorage.getItem('nearly_last_city');
        if (stored) {
          const valid = data.some((c) => c.slug === stored);
          if (valid) {
            navigate(`/digest/${stored}`, { replace: true });
            return;
          }
          localStorage.removeItem('nearly_last_city');
        }
        setCities(data);
      })
      .catch((err: unknown) => setLoadError((err as Error).message));
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-inverse)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Logo + tagline */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--color-text-inverse)',
          }}
        >
          nearly.
        </div>
        <div
          style={{
            color: 'var(--color-text-brand-on-dark)',
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 6,
          }}
        >
          Your city. Daily.
        </div>
      </div>

      {loadError ? (
        <p style={{ color: '#f88', marginTop: 24, fontSize: 13 }}>
          Failed to load cities: {loadError}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            maxWidth: 360,
            margin: '0 auto',
            padding: '32px 24px',
            width: '100%',
          }}
        >
          {cities.map((city) => (
            <CityCard
              key={city.slug}
              city={city}
              onClick={() => navigate(`/digest/${city.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CityCard({ city, onClick }: { city: City; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        textAlign: 'center',
        cursor: 'pointer',
        border: `1px solid ${hovered ? 'var(--color-brand)' : 'transparent'}`,
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'var(--transition-fast)',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {city.display_name}
      </div>
    </div>
  );
}
