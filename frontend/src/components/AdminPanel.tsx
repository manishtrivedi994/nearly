import { useState } from 'react';
import { triggerRun } from '../lib/api';
import type { City } from '../types';

interface AdminPanelProps {
  cities: City[];
}

export function AdminPanel({ cities }: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [citySlug, setCitySlug] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTrigger() {
    setLoading(true);
    setStatus(null);
    try {
      await triggerRun(password, citySlug || undefined);
      setStatus('Pipeline triggered successfully.');
    } catch (err) {
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      padding: 20,
      marginTop: 40,
      background: '#fff',
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Admin panel</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300 }}>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
        />
        <select
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 }}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.display_name}</option>
          ))}
        </select>
        <button
          onClick={handleTrigger}
          disabled={!password || loading}
          style={{
            padding: '9px',
            borderRadius: 4,
            background: !password || loading ? '#999' : '#1a1a1a',
            color: '#fff',
            border: 'none',
            cursor: !password || loading ? 'default' : 'pointer',
            fontSize: 14,
          }}
        >
          {loading ? 'Running…' : 'Trigger run'}
        </button>
        {status && (
          <p style={{ margin: 0, fontSize: 13, color: status.startsWith('Error') ? '#c00' : '#090' }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
