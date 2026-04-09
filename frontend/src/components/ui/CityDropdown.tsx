import { useState, useEffect, useRef } from 'react';
import type { City } from '../../types';

interface CityDropdownProps {
  currentCity: string;
  cities: City[];
  onSelect: (slug: string) => void;
}

export function CityDropdown({ currentCity, cities, onSelect }: CityDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'none',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-pill)',
          padding: '4px 10px 4px 12px',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {currentCity}
        {/* CSS triangle chevron */}
        <span
          style={{
            display: 'inline-block',
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '5px solid var(--color-text-muted)',
            marginTop: open ? -2 : 2,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: 160,
            maxHeight: '60vh',
            overflowY: 'auto',
            zIndex: 200,
          }}
        >
          {cities.map((city) => (
            <button
              key={city.slug}
              onClick={() => {
                setOpen(false);
                onSelect(city.slug);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: city.slug === currentCity.toLowerCase() ? 'var(--color-brand-light)' : 'none',
                border: 'none',
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: city.slug === currentCity.toLowerCase() ? 600 : 400,
                color: city.slug === currentCity.toLowerCase()
                  ? 'var(--color-text-brand)'
                  : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={(e) => {
                if (city.slug !== currentCity.toLowerCase()) {
                  e.currentTarget.style.background = 'var(--color-bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  city.slug === currentCity.toLowerCase() ? 'var(--color-brand-light)' : 'none';
              }}
            >
              {city.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
