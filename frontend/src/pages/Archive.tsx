import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCities } from '../lib/api';
import { Navbar } from '../components/ui/Navbar';
import type { City } from '../types';

function last30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toLocaleDateString('en-CA')); // YYYY-MM-DD
  }
  return days;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const DAYS = last30Days();
const TODAY = DAYS[0];
const YESTERDAY = DAYS[1];

function dayLabel(iso: string): string {
  if (iso === TODAY) return 'Today';
  if (iso === YESTERDAY) return 'Yesterday';
  return formatDate(iso);
}

export function Archive() {
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  const [cities, setCities] = useState<City[]>([]);
  const navigate = useNavigate();

  const displayCity = citySlug.charAt(0).toUpperCase() + citySlug.slice(1);

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <Navbar
        city={displayCity}
        cities={cities}
        onCitySelect={(slug) => navigate(`/digest/${slug}/archive`)}
        onLogoClick={() => navigate('/')}
      />

      {/* Hero band */}
      <div style={{ background: 'var(--color-bg-inverse)', padding: '20px 16px' }}>
        <div
          style={{
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            fontSize: 11,
            color: 'var(--color-text-brand-on-dark)',
          }}
        >
          {displayCity}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-text-inverse)',
            lineHeight: 1.3,
            marginTop: 4,
          }}
        >
          Archive
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-brand-muted)', marginTop: 4 }}>
          Last 30 days
        </div>
      </div>

      {/* Date list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {DAYS.map((iso, idx) => (
          <DateRow
            key={iso}
            iso={iso}
            label={dayLabel(iso)}
            isFirst={idx === 0}
            onClick={() => navigate(`/digest/${citySlug}/${iso}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface DateRowProps {
  iso: string;
  label: string;
  isFirst: boolean;
  onClick: () => void;
}

function DateRow({ iso, label, isFirst, onClick }: DateRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: hovered ? 'var(--color-bg-primary)' : 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        transition: 'var(--transition-fast)',
        width: '100%',
      }}
    >
      <div>
        <span
          style={{
            fontSize: 13,
            fontWeight: isFirst ? 600 : 400,
            color: isFirst ? 'var(--color-text-brand)' : 'var(--color-text-primary)',
          }}
        >
          {label}
        </span>
        {isFirst && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-brand)',
              background: 'var(--color-brand-light)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Latest
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {iso} ›
      </span>
    </button>
  );
}
