import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities } from '../lib/api';
import { CityPicker } from '../components/CityPicker';
import type { City } from '../types';

export function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [selected, setSelected] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch((err: unknown) => setLoadError((err as Error).message));
  }, []);

  function handleChange(slug: string) {
    setSelected(slug);
    if (slug) navigate(`/digest/${slug}`);
  }

  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <img
        src="/nearly-horizontal.svg"
        alt="nearly."
        style={{ width: 220, marginBottom: 24 }}
      />
      <p style={{ color: '#666', marginBottom: 32, fontSize: 15 }}>
        A 2-minute AI-curated local news digest.
      </p>
      {loadError ? (
        <p style={{ color: '#c00' }}>Failed to load cities: {loadError}</p>
      ) : (
        <CityPicker cities={cities} value={selected} onChange={handleChange} />
      )}
    </div>
  );
}
